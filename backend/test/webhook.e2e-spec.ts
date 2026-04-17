import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as express from 'express';
import * as crypto from 'crypto';
import { WhatsappController } from '../src/whatsapp/whatsapp.controller';
import { WhatsappService } from '../src/whatsapp/whatsapp.service';
import { EventsGateway } from '../src/gateway/events.gateway';
import { WebhookSignatureGuard } from '../src/common/guards/webhook-signature.guard';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_VERIFY_TOKEN = 'test_verify_token';
const TEST_APP_SECRET = 'test_app_secret_32chars_minimum!!';

interface RawBodyRequest extends express.Request {
  rawBody?: Buffer;
}

function buildTextPayload(phoneNumberId = 'phone-id-1') {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+551234567890',
                phone_number_id: phoneNumberId,
              },
              contacts: [{ profile: { name: 'Test' }, wa_id: '5511' }],
              messages: [
                {
                  id: 'ext-1',
                  from: '5511',
                  timestamp: '12345',
                  type: 'text',
                  text: { body: 'hello' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function hmacSignature(body: string, secret: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', secret).update(Buffer.from(body)).digest('hex')
  );
}

async function createApp(nodeEnv: 'development' | 'production' | 'test') {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [WhatsappController],
    providers: [
      {
        provide: WhatsappService,
        useValue: {
          verifyWebhook: jest.fn(
            (mode: string, token: string, challenge: string) => {
              if (mode === 'subscribe' && token === TEST_VERIFY_TOKEN) {
                return challenge;
              }
              const { NotFoundException } = require('@nestjs/common');
              throw new NotFoundException('Token de verificação inválido');
            },
          ),
          processWebhook: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: EventsGateway,
        useValue: { emitToWorkspace: jest.fn() },
      },
      WebhookSignatureGuard,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            if (key === 'NODE_ENV') return nodeEnv;
            if (key === 'WHATSAPP_APP_SECRET') return TEST_APP_SECRET;
            if (key === 'WHATSAPP_VERIFY_TOKEN') return TEST_VERIFY_TOKEN;
            return undefined;
          }),
          getOrThrow: jest.fn((key: string) => {
            if (key === 'NODE_ENV') return nodeEnv;
            if (key === 'WHATSAPP_APP_SECRET') return TEST_APP_SECRET;
            return TEST_VERIFY_TOKEN;
          }),
        },
      },
      {
        provide: PrismaService,
        useValue: {
          whatsappAccount: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
      },
    ],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');

  // Replicar middleware rawBody do bootstrap
  app.use(
    express.json({
      verify: (req: RawBodyRequest, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return app;
}

// ─── GET /api/whatsapp/webhook — verify ──────────────────────────────────────

describe('GET /api/whatsapp/webhook', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp('test');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns challenge when token matches', async () => {
    await request(app.getHttpServer())
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': TEST_VERIFY_TOKEN,
        'hub.challenge': 'challenge_abc',
      })
      .expect(200)
      .expect('challenge_abc');
  });

  it('returns 404 when token does not match', async () => {
    await request(app.getHttpServer())
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'ch',
      })
      .expect(404);
  });

  it('returns 404 when mode is not subscribe', async () => {
    await request(app.getHttpServer())
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'unsubscribe',
        'hub.verify_token': TEST_VERIFY_TOKEN,
        'hub.challenge': 'ch',
      })
      .expect(404);
  });
});

// ─── POST /api/whatsapp/webhook — dev mode (signature optional) ───────────────

describe('POST /api/whatsapp/webhook — dev mode', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp('development');
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts request without signature in dev mode', async () => {
    const payload = buildTextPayload();
    await request(app.getHttpServer())
      .post('/api/whatsapp/webhook')
      .send(payload)
      .expect(200)
      .expect('ok');
  });

  it('accepts request with valid HMAC signature', async () => {
    const payload = buildTextPayload();
    const body = JSON.stringify(payload);
    const sig = hmacSignature(body, TEST_APP_SECRET);

    await request(app.getHttpServer())
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', sig)
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(200);
  });

  it('rejects request with invalid HMAC signature', async () => {
    const payload = buildTextPayload();
    const body = JSON.stringify(payload);
    const wrongSig = hmacSignature(body, 'wrong_secret_wrong_secret_wrong!!');

    await request(app.getHttpServer())
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', wrongSig)
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(401);
  });
});

// ─── POST /api/whatsapp/webhook — production mode (signature required) ────────

describe('POST /api/whatsapp/webhook — production mode', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp('production');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects request without signature in production mode', async () => {
    // Use distinct msgId to avoid replay-cache collision with dev-mode suite
    const payload = buildTextPayload('phone-id-prod');
    await request(app.getHttpServer())
      .post('/api/whatsapp/webhook')
      .send(payload)
      .expect(401);
  });

  it('accepts request with valid HMAC signature in production mode', async () => {
    // Use distinct msgId so the signature hash is not in the replay cache from dev suite
    const payload = buildTextPayload('phone-id-prod-valid');
    const body = JSON.stringify(payload);
    const sig = hmacSignature(body, TEST_APP_SECRET);

    await request(app.getHttpServer())
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', sig)
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(200);
  });
});
