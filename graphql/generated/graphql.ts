import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '@/graphql/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
};

export type Attachment = {
  __typename?: 'Attachment';
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  sizeBytes: Scalars['Int']['output'];
  storagePath: Scalars['String']['output'];
};

export type Campaign = {
  __typename?: 'Campaign';
  autoSend: Scalars['Boolean']['output'];
  columnMapping: Scalars['JSON']['output'];
  createdAt: Scalars['String']['output'];
  csvFile: CsvFile;
  emailColumn: Scalars['String']['output'];
  emailLogs: Array<EmailLog>;
  id: Scalars['ID']['output'];
  status: CampaignStatus;
  template: Template;
};

export type CampaignStats = {
  __typename?: 'CampaignStats';
  bounced: Scalars['Int']['output'];
  campaignId: Scalars['ID']['output'];
  failed: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  queued: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export enum CampaignStatus {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  Paused = 'PAUSED'
}

export type CsvFile = {
  __typename?: 'CsvFile';
  campaigns: Array<Campaign>;
  columns: Array<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  processedRows: Array<Scalars['String']['output']>;
  rowCount: Scalars['Int']['output'];
  rowHash: Scalars['String']['output'];
  storagePath: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type EmailLog = {
  __typename?: 'EmailLog';
  campaignId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  messageId?: Maybe<Scalars['String']['output']>;
  recipientEmail: Scalars['String']['output'];
  retryCount: Scalars['Int']['output'];
  rowData: Scalars['JSON']['output'];
  sentAt?: Maybe<Scalars['String']['output']>;
  status: EmailStatus;
};

export type EmailLogConnection = {
  __typename?: 'EmailLogConnection';
  items: Array<EmailLog>;
  totalCount: Scalars['Int']['output'];
};

export enum EmailStatus {
  Bounced = 'BOUNCED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Queued = 'QUEUED',
  Sent = 'SENT'
}

export type Mutation = {
  __typename?: 'Mutation';
  createAttachment: Attachment;
  createCampaign: Campaign;
  createTemplate: Template;
  deleteCampaign: Scalars['Boolean']['output'];
  deleteCsvFile: Scalars['Boolean']['output'];
  deleteTemplate: Scalars['Boolean']['output'];
  retryCampaign: Scalars['Boolean']['output'];
  saveSmtpConfig: SmtpConfig;
  triggerCampaign: Scalars['Boolean']['output'];
  updateCampaignStatus: Campaign;
  updateTemplate: Template;
};


export type MutationCreateAttachmentArgs = {
  filename: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
  storagePath: Scalars['String']['input'];
};


export type MutationCreateCampaignArgs = {
  autoSend: Scalars['Boolean']['input'];
  columnMapping: Scalars['JSON']['input'];
  csvFileId: Scalars['ID']['input'];
  emailColumn: Scalars['String']['input'];
  templateId: Scalars['ID']['input'];
};


export type MutationCreateTemplateArgs = {
  attachmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  body: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};


export type MutationDeleteCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCsvFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRetryCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSaveSmtpConfigArgs = {
  fromEmail: Scalars['String']['input'];
  fromName: Scalars['String']['input'];
  host: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  username: Scalars['String']['input'];
};


export type MutationTriggerCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateCampaignStatusArgs = {
  id: Scalars['ID']['input'];
  status: CampaignStatus;
};


export type MutationUpdateTemplateArgs = {
  attachmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  body?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  campaign?: Maybe<Campaign>;
  campaignStats: CampaignStats;
  campaigns: Array<Campaign>;
  csvFile?: Maybe<CsvFile>;
  csvFiles: Array<CsvFile>;
  emailLogs: EmailLogConnection;
  me?: Maybe<User>;
  template?: Maybe<Template>;
  templates: Array<Template>;
};


export type QueryCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCampaignStatsArgs = {
  campaignId: Scalars['ID']['input'];
};


export type QueryCsvFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmailLogsArgs = {
  campaignId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmailStatus>;
};


export type QueryTemplateArgs = {
  id: Scalars['ID']['input'];
};

export type SmtpConfig = {
  __typename?: 'SmtpConfig';
  fromEmail: Scalars['String']['output'];
  fromName: Scalars['String']['output'];
  host: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  port: Scalars['Int']['output'];
  username: Scalars['String']['output'];
};

export type Template = {
  __typename?: 'Template';
  attachments: Array<Attachment>;
  body: Scalars['String']['output'];
  campaigns: Array<Campaign>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  variables: Array<Scalars['String']['output']>;
};

export type User = {
  __typename?: 'User';
  campaigns: Array<Campaign>;
  createdAt: Scalars['String']['output'];
  csvFiles: Array<CsvFile>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  smtpConfig?: Maybe<SmtpConfig>;
  templates: Array<Template>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Attachment: ResolverTypeWrapper<Attachment>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Campaign: ResolverTypeWrapper<Campaign>;
  CampaignStats: ResolverTypeWrapper<CampaignStats>;
  CampaignStatus: CampaignStatus;
  CsvFile: ResolverTypeWrapper<CsvFile>;
  EmailLog: ResolverTypeWrapper<EmailLog>;
  EmailLogConnection: ResolverTypeWrapper<EmailLogConnection>;
  EmailStatus: EmailStatus;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SmtpConfig: ResolverTypeWrapper<SmtpConfig>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Template: ResolverTypeWrapper<Template>;
  User: ResolverTypeWrapper<User>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Attachment: Attachment;
  Boolean: Scalars['Boolean']['output'];
  Campaign: Campaign;
  CampaignStats: CampaignStats;
  CsvFile: CsvFile;
  EmailLog: EmailLog;
  EmailLogConnection: EmailLogConnection;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  SmtpConfig: SmtpConfig;
  String: Scalars['String']['output'];
  Template: Template;
  User: User;
}>;

export type AttachmentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Attachment'] = ResolversParentTypes['Attachment']> = ResolversObject<{
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mimeType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  storagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type CampaignResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Campaign'] = ResolversParentTypes['Campaign']> = ResolversObject<{
  autoSend?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  columnMapping?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  csvFile?: Resolver<ResolversTypes['CsvFile'], ParentType, ContextType>;
  emailColumn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emailLogs?: Resolver<Array<ResolversTypes['EmailLog']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CampaignStatus'], ParentType, ContextType>;
  template?: Resolver<ResolversTypes['Template'], ParentType, ContextType>;
}>;

export type CampaignStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CampaignStats'] = ResolversParentTypes['CampaignStats']> = ResolversObject<{
  bounced?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  campaignId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pending?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  queued?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type CsvFileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CsvFile'] = ResolversParentTypes['CsvFile']> = ResolversObject<{
  campaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  columns?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  processedRows?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  rowCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rowHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  storagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type EmailLogResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EmailLog'] = ResolversParentTypes['EmailLog']> = ResolversObject<{
  campaignId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messageId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recipientEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  retryCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rowData?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  sentAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EmailStatus'], ParentType, ContextType>;
}>;

export type EmailLogConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EmailLogConnection'] = ResolversParentTypes['EmailLogConnection']> = ResolversObject<{
  items?: Resolver<Array<ResolversTypes['EmailLog']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createAttachment?: Resolver<ResolversTypes['Attachment'], ParentType, ContextType, RequireFields<MutationCreateAttachmentArgs, 'filename' | 'mimeType' | 'sizeBytes' | 'storagePath'>>;
  createCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationCreateCampaignArgs, 'autoSend' | 'columnMapping' | 'csvFileId' | 'emailColumn' | 'templateId'>>;
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'body' | 'name' | 'subject'>>;
  deleteCampaign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCampaignArgs, 'id'>>;
  deleteCsvFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCsvFileArgs, 'id'>>;
  deleteTemplate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTemplateArgs, 'id'>>;
  retryCampaign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRetryCampaignArgs, 'id'>>;
  saveSmtpConfig?: Resolver<ResolversTypes['SmtpConfig'], ParentType, ContextType, RequireFields<MutationSaveSmtpConfigArgs, 'fromEmail' | 'fromName' | 'host' | 'password' | 'port' | 'username'>>;
  triggerCampaign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTriggerCampaignArgs, 'id'>>;
  updateCampaignStatus?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationUpdateCampaignStatusArgs, 'id' | 'status'>>;
  updateTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationUpdateTemplateArgs, 'id'>>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<QueryCampaignArgs, 'id'>>;
  campaignStats?: Resolver<ResolversTypes['CampaignStats'], ParentType, ContextType, RequireFields<QueryCampaignStatsArgs, 'campaignId'>>;
  campaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  csvFile?: Resolver<Maybe<ResolversTypes['CsvFile']>, ParentType, ContextType, RequireFields<QueryCsvFileArgs, 'id'>>;
  csvFiles?: Resolver<Array<ResolversTypes['CsvFile']>, ParentType, ContextType>;
  emailLogs?: Resolver<ResolversTypes['EmailLogConnection'], ParentType, ContextType, RequireFields<QueryEmailLogsArgs, 'campaignId'>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  template?: Resolver<Maybe<ResolversTypes['Template']>, ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
  templates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType>;
}>;

export type SmtpConfigResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SmtpConfig'] = ResolversParentTypes['SmtpConfig']> = ResolversObject<{
  fromEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type TemplateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = ResolversObject<{
  attachments?: Resolver<Array<ResolversTypes['Attachment']>, ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  campaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  variables?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  campaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  csvFiles?: Resolver<Array<ResolversTypes['CsvFile']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  smtpConfig?: Resolver<Maybe<ResolversTypes['SmtpConfig']>, ParentType, ContextType>;
  templates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Attachment?: AttachmentResolvers<ContextType>;
  Campaign?: CampaignResolvers<ContextType>;
  CampaignStats?: CampaignStatsResolvers<ContextType>;
  CsvFile?: CsvFileResolvers<ContextType>;
  EmailLog?: EmailLogResolvers<ContextType>;
  EmailLogConnection?: EmailLogConnectionResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SmtpConfig?: SmtpConfigResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;

