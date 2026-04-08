import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
