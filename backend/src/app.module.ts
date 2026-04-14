import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TeamsModule } from './teams/teams.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AutomationModule } from './automation/automation.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { GatewayModule } from './gateway/gateway.module';
import { QueuesModule } from './queues/queues.module';
import { TemplatesModule } from './templates/templates.module';
import { QuickRepliesModule } from './quick-replies/quick-replies.module';
import { InteractiveTemplatesModule } from './interactive-templates/interactive-templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TeamsModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WhatsappModule,
    AutomationModule,
    PipelinesModule,
    WorkspacesModule,
    GatewayModule,
    QueuesModule,
    TemplatesModule,
    QuickRepliesModule,
    InteractiveTemplatesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
