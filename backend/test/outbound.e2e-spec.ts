import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { MessagesController } from '../src/messages/messages.controller';
import { MessagesService } from '../src/messages/messages.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

const TEST_JWT_SECRET = 'test_jwt_secret_for_e2e_tests_only';
const WORKSPACE_ID = 'ws-e2e-1';
const USER_ID = 'user-e2e-1';
const CONV_ID = '00000000-0000-4000-a000-000000000001';

function makeToken(permissions: string[] = []) {
  return jwt.sign(
    {
      sub: USER_ID,
      email: 'test@example.com',
      workspaceId: WORKSPACE_ID,
      permissions,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const MOCK_MESSAGE = {
  id: 'msg-e2e-1',
  type: 'text',
  content: 'hello',
  status: 'queued',
};

describe('POST /api/messages', () => {
  let app: INestApplication;
  let messagesService: jest.Mocked<MessagesService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_JWT_SECRET }),
      ],
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            send: jest.fn().mockResolvedValue(MOCK_MESSAGE),
            findByConversation: jest.fn().mockResolvedValue([]),
            search: jest.fn().mockResolvedValue([]),
            react: jest.fn().mockResolvedValue({}),
            retry: jest.fn().mockResolvedValue({}),
            remove: jest.fn().mockResolvedValue({}),
          },
        },
        JwtStrategy,
        JwtAuthGuard,
        PermissionsGuard,
        Reflector,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
              return undefined;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
              throw new Error(`Missing: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    messagesService = moduleFixture.get(MessagesService);

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (messagesService.send as jest.Mock).mockResolvedValue(MOCK_MESSAGE);
  });

  // ─── Authentication ───────────────────────────────────────────────────────

  it('returns 401 when no Authorization header is provided', async () => {
    await request(app.getHttpServer())
      .post('/api/messages')
      .send({ conversationId: CONV_ID, content: 'hi', type: 'text' })
      .expect(401);
  });

  it('returns 401 when JWT token is malformed', async () => {
    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', 'Bearer not.a.valid.jwt')
      .send({ conversationId: CONV_ID, content: 'hi', type: 'text' })
      .expect(401);
  });

  it('returns 401 when JWT is signed with wrong secret', async () => {
    const badToken = jwt.sign(
      {
        sub: USER_ID,
        email: 'x@x.com',
        workspaceId: WORKSPACE_ID,
        permissions: ['respond_conversation'],
      },
      'wrong_secret',
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${badToken}`)
      .send({ conversationId: CONV_ID, content: 'hi', type: 'text' })
      .expect(401);
  });

  // ─── Authorization ────────────────────────────────────────────────────────

  it('returns 403 when user lacks respond_conversation permission', async () => {
    const token = makeToken([]); // no permissions

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId: CONV_ID, content: 'hi', type: 'text' })
      .expect(403);
  });

  // ─── Text message — happy path ────────────────────────────────────────────

  it('sends text message and returns the created message', async () => {
    const token = makeToken(['respond_conversation']);

    const res = await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId: CONV_ID, content: 'hello world', type: 'text' })
      .expect(201);

    expect(res.body).toMatchObject({ id: MOCK_MESSAGE.id, status: 'queued' });
    expect(messagesService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        content: 'hello world',
        type: 'text',
      }),
      WORKSPACE_ID,
      USER_ID,
      ['respond_conversation'],
    );
  });

  it('passes workspaceId and userId from JWT — never from request body', async () => {
    const token = makeToken(['respond_conversation']);

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId: CONV_ID, content: 'hi', type: 'text' })
      .expect(201);

    const [, calledWorkspaceId, calledUserId] = (
      messagesService.send as jest.Mock
    ).mock.calls[0];
    expect(calledWorkspaceId).toBe(WORKSPACE_ID);
    expect(calledUserId).toBe(USER_ID);
  });

  it('returns 400 when required fields are missing', async () => {
    const token = makeToken(['respond_conversation']);

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // missing conversationId, content/mediaUrl, type
      .expect(400);
  });
});

// ─── GET /api/messages ────────────────────────────────────────────────────────

describe('GET /api/messages', () => {
  let app: INestApplication;
  let messagesService: jest.Mocked<MessagesService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_JWT_SECRET }),
      ],
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            findByConversation: jest.fn().mockResolvedValue([]),
            send: jest.fn(),
            search: jest.fn().mockResolvedValue([]),
            react: jest.fn(),
            retry: jest.fn(),
            remove: jest.fn(),
          },
        },
        JwtStrategy,
        JwtAuthGuard,
        PermissionsGuard,
        Reflector,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(TEST_JWT_SECRET),
            getOrThrow: jest.fn().mockReturnValue(TEST_JWT_SECRET),
          },
        },
      ],
    }).compile();

    messagesService = moduleFixture.get(MessagesService);

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/messages')
      .query({ conversationId: CONV_ID })
      .expect(401);
  });

  it('returns messages for authenticated user', async () => {
    const token = makeToken(['view_conversations']);
    (messagesService.findByConversation as jest.Mock).mockResolvedValue([
      { id: 'msg-1' },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .query({ conversationId: CONV_ID })
      .expect(200);

    expect(res.body).toEqual([{ id: 'msg-1' }]);
  });
});
