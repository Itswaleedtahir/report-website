import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values: string[] | number[]): this;
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url: string, variables?: {}): void;
    /**
     * Returns a document and all associated document data. Supply the unique document ID from
     * either a document creation request or Document page URL.
     *
     * @summary Get Document
     * @throws FetchError<404, types.GetApiV1DocumentsIdResponse404> not_found
     */
    getApiV1DocumentsId(metadata: types.GetApiV1DocumentsIdMetadataParam): Promise<FetchResponse<200, types.GetApiV1DocumentsIdResponse200>>;
    /**
     * Deletes a document. Deleting a document will also cancel document signing (if in
     * progress).  Supply the unique document ID from either a Create Document request or
     * document page URL.
     *
     * @summary Delete Document
     * @throws FetchError<404, types.DeleteApiV1DocumentsIdResponse404> not found
     */
    deleteApiV1DocumentsId(metadata: types.DeleteApiV1DocumentsIdMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Creates and optionally sends a new document for signing. If `draft` is set to true the
     * document will not be sent.
     *
     * @summary Create Document
     * @throws FetchError<400, types.PostApiV1DocumentsResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentsResponse422> unprocessable entity
     */
    postApiV1Documents(body: types.PostApiV1DocumentsBodyParam): Promise<FetchResponse<201, types.PostApiV1DocumentsResponse201>>;
    /**
     * Creates and optionally sends a new document for signing. If `draft` is set to true the
     * document will not be sent.
     *
     * @summary Create Document from Template
     * @throws FetchError<400, types.PostApiV1DocumentTemplatesDocumentsResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentTemplatesDocumentsResponse422> unprocessable entity
     */
    postApiV1Document_templatesDocuments(body: types.PostApiV1DocumentTemplatesDocumentsBodyParam): Promise<FetchResponse<201, types.PostApiV1DocumentTemplatesDocumentsResponse201>>;
    /**
     * Updates a draft document and sends it to be signed by recipients.
     *
     * @summary Update and Send Document
     * @throws FetchError<422, types.PostApiV1DocumentsIdSendResponse422> unprocessable entity
     */
    postApiV1DocumentsIdSend(body: types.PostApiV1DocumentsIdSendBodyParam, metadata: types.PostApiV1DocumentsIdSendMetadataParam): Promise<FetchResponse<201, types.PostApiV1DocumentsIdSendResponse201>>;
    postApiV1DocumentsIdSend(metadata: types.PostApiV1DocumentsIdSendMetadataParam): Promise<FetchResponse<201, types.PostApiV1DocumentsIdSendResponse201>>;
    /**
     * Sends a reminder email to recipients that have not signed yet.
     *
     * @summary Send Reminder
     * @throws FetchError<404, types.PostApiV1DocumentsIdRemindResponse404> not found
     * @throws FetchError<422, types.PostApiV1DocumentsIdRemindResponse422> unprocessable entity
     */
    postApiV1DocumentsIdRemind(body: types.PostApiV1DocumentsIdRemindBodyParam, metadata: types.PostApiV1DocumentsIdRemindMetadataParam): Promise<FetchResponse<201, types.PostApiV1DocumentsIdRemindResponse201>>;
    postApiV1DocumentsIdRemind(metadata: types.PostApiV1DocumentsIdRemindMetadataParam): Promise<FetchResponse<201, types.PostApiV1DocumentsIdRemindResponse201>>;
    /**
     * Gets a completed document PDF. Supply the unique document ID from either a document
     * creation request or document page URL.
     *
     * @summary Completed PDF
     * @throws FetchError<404, types.GetApiV1DocumentsIdCompletedPdfResponse404> not_found
     */
    getApiV1DocumentsIdCompleted_pdf(metadata: types.GetApiV1DocumentsIdCompletedPdfMetadataParam): Promise<FetchResponse<200, types.GetApiV1DocumentsIdCompletedPdfResponse200>>;
    /**
     * Returns a template and all associated template data. Supply the unique template ID from
     * either a Create Template request or template page URL.
     *
     * @summary Get Template
     * @throws FetchError<404, types.GetApiV1DocumentTemplatesIdResponse404> not_found
     */
    getApiV1Document_templatesId(metadata: types.GetApiV1DocumentTemplatesIdMetadataParam): Promise<FetchResponse<200, types.GetApiV1DocumentTemplatesIdResponse200>>;
    /**
     * Updates an existing template.
     *
     * @summary Update Template
     * @throws FetchError<400, types.PutApiV1DocumentTemplatesIdResponse400> bad request
     * @throws FetchError<422, types.PutApiV1DocumentTemplatesIdResponse422> unprocessable entity
     */
    putApiV1Document_templatesId(body: types.PutApiV1DocumentTemplatesIdBodyParam, metadata: types.PutApiV1DocumentTemplatesIdMetadataParam): Promise<FetchResponse<200, types.PutApiV1DocumentTemplatesIdResponse200>>;
    /**
     * Deletes a template. Supply the unique template ID from either a Create Template request
     * or template page URL.
     *
     * @summary Delete Template
     * @throws FetchError<404, types.DeleteApiV1DocumentTemplatesIdResponse404> not found
     */
    deleteApiV1Document_templatesId(metadata: types.DeleteApiV1DocumentTemplatesIdMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Creates a new template.
     *
     * @summary Create Template
     * @throws FetchError<400, types.PostApiV1DocumentTemplatesResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentTemplatesResponse422> unprocessable entity
     */
    postApiV1Document_templates(body: types.PostApiV1DocumentTemplatesBodyParam): Promise<FetchResponse<201, types.PostApiV1DocumentTemplatesResponse201>>;
    /**
     * Gets the details of a specific API Application within an account. Supply the unique
     * Application ID from either the Create API Application response or the API Application
     * edit page.
     *
     * @summary Get API Application
     * @throws FetchError<404, types.GetApiV1ApiApplicationsIdResponse404> not_found
     */
    getApiV1Api_applicationsId(metadata: types.GetApiV1ApiApplicationsIdMetadataParam): Promise<FetchResponse<200, types.GetApiV1ApiApplicationsIdResponse200>>;
    /**
     * Deletes an API Application from an account. Supply the unique Application ID from either
     * the Create API Application response or the API Application edit page
     *
     * @summary Delete API Application
     * @throws FetchError<404, types.DeleteApiV1ApiApplicationsIdResponse404> not found
     */
    deleteApiV1Api_applicationsId(metadata: types.DeleteApiV1ApiApplicationsIdMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * List all the webhooks in the account.
     *
     * @summary List Webhooks
     */
    getApiV1Hooks(): Promise<FetchResponse<200, types.GetApiV1HooksResponse200>>;
    /**
     * Register a callback URL that we will post document events to.
     *
     * @summary Create Webhook
     * @throws FetchError<400, types.PostApiV1HooksResponse400> bad request
     */
    postApiV1Hooks(body: types.PostApiV1HooksBodyParam): Promise<FetchResponse<201, types.PostApiV1HooksResponse201>>;
    /**
     * Deletes a registered callback URL that we are posting document events to.
     *
     * @summary Delete Webhook
     * @throws FetchError<404, types.DeleteApiV1HooksIdResponse404> not found
     */
    deleteApiV1HooksId(metadata: types.DeleteApiV1HooksIdMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Retrieves the account information associated with the API key being used.
     *
     * @summary Get credentials
     * @throws FetchError<401, types.GetApiV1MeResponse401> unauthorized
     */
    getApiV1Me(): Promise<FetchResponse<200, types.GetApiV1MeResponse200>>;
    /**
     * Returns information about the Bulk Send.
     *
     * @summary Get Bulk Send
     * @throws FetchError<401, types.GetApiV1BulkSendsIdResponse401> unauthorized
     * @throws FetchError<404, types.GetApiV1BulkSendsIdResponse404> not found
     */
    getApiV1Bulk_sendsId(metadata: types.GetApiV1BulkSendsIdMetadataParam): Promise<FetchResponse<200, types.GetApiV1BulkSendsIdResponse200>>;
    /**
     * Returns information about the Bulk Send.
     *
     * @summary List Bulk Sendings
     * @throws FetchError<401, types.GetApiV1BulkSendsResponse401> unauthorized
     */
    getApiV1Bulk_sends(metadata?: types.GetApiV1BulkSendsMetadataParam): Promise<FetchResponse<200, types.GetApiV1BulkSendsResponse200>>;
    /**
     * Creates a bulk send, and it validates the CSV file before creating the bulk send.
     *
     * @summary Create Bulk Send
     * @throws FetchError<401, types.PostApiV1BulkSendsResponse401> unauthorized
     * @throws FetchError<422, types.PostApiV1BulkSendsResponse422> unprocessable entity
     */
    postApiV1Bulk_sends(body: types.PostApiV1BulkSendsBodyParam): Promise<FetchResponse<201, types.PostApiV1BulkSendsResponse201>>;
    /**
     * Fetches a CSV template that corresponds to the provided document template IDs. CSV
     * templates are blank CSV files that have columns containing required and optional data
     * that can be sent when creating a bulk send. Fields can be referenced by the field label.
     * Example: [placeholder name]_[field label] could be something like customer_address or
     * signer_company_name (if "Customer" and "Signer" were placeholder names for templates set
     * up in SignWell).
     *
     * @summary Get Bulk Send CSV Template
     * @throws FetchError<401, types.GetApiV1BulkSendsCsvTemplateResponse401> unauthorized
     * @throws FetchError<404, types.GetApiV1BulkSendsCsvTemplateResponse404> not found
     */
    getApiV1Bulk_sendsCsv_template(metadata: types.GetApiV1BulkSendsCsvTemplateMetadataParam): Promise<FetchResponse<200, types.GetApiV1BulkSendsCsvTemplateResponse200>>;
    /**
     * Validates a Bulk Send CSV file before creating the Bulk Send. It will check the
     * structure of the CSV and the data it contains, and return any errors found.
     *
     * @summary Validate Bulk Send CSV
     * @throws FetchError<401, types.PostApiV1BulkSendsValidateCsvResponse401> unauthorized
     * @throws FetchError<422, types.PostApiV1BulkSendsValidateCsvResponse422> unprocessable entity
     */
    postApiV1Bulk_sendsValidate_csv(body: types.PostApiV1BulkSendsValidateCsvBodyParam): Promise<FetchResponse<200, types.PostApiV1BulkSendsValidateCsvResponse200>>;
    /**
     * Returns information about the Bulk Send.
     *
     * @summary Get Bulk Send Documents
     * @throws FetchError<401, types.GetApiV1BulkSendsIdDocumentsResponse401> unauthorized
     * @throws FetchError<404, types.GetApiV1BulkSendsIdDocumentsResponse404> not found
     */
    getApiV1Bulk_sendsIdDocuments(metadata: types.GetApiV1BulkSendsIdDocumentsMetadataParam): Promise<FetchResponse<200, types.GetApiV1BulkSendsIdDocumentsResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
