"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'signwell/1 (api/6.1.2)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
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
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
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
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Returns a document and all associated document data. Supply the unique document ID from
     * either a document creation request or Document page URL.
     *
     * @summary Get Document
     * @throws FetchError<404, types.GetApiV1DocumentsIdResponse404> not_found
     */
    SDK.prototype.getApiV1DocumentsId = function (metadata) {
        return this.core.fetch('/api/v1/documents/{id}/', 'get', metadata);
    };
    /**
     * Deletes a document. Deleting a document will also cancel document signing (if in
     * progress).  Supply the unique document ID from either a Create Document request or
     * document page URL.
     *
     * @summary Delete Document
     * @throws FetchError<404, types.DeleteApiV1DocumentsIdResponse404> not found
     */
    SDK.prototype.deleteApiV1DocumentsId = function (metadata) {
        return this.core.fetch('/api/v1/documents/{id}/', 'delete', metadata);
    };
    /**
     * Creates and optionally sends a new document for signing. If `draft` is set to true the
     * document will not be sent.
     *
     * @summary Create Document
     * @throws FetchError<400, types.PostApiV1DocumentsResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentsResponse422> unprocessable entity
     */
    SDK.prototype.postApiV1Documents = function (body) {
        return this.core.fetch('/api/v1/documents/', 'post', body);
    };
    /**
     * Creates and optionally sends a new document for signing. If `draft` is set to true the
     * document will not be sent.
     *
     * @summary Create Document from Template
     * @throws FetchError<400, types.PostApiV1DocumentTemplatesDocumentsResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentTemplatesDocumentsResponse422> unprocessable entity
     */
    SDK.prototype.postApiV1Document_templatesDocuments = function (body) {
        return this.core.fetch('/api/v1/document_templates/documents/', 'post', body);
    };
    SDK.prototype.postApiV1DocumentsIdSend = function (body, metadata) {
        return this.core.fetch('/api/v1/documents/{id}/send/', 'post', body, metadata);
    };
    SDK.prototype.postApiV1DocumentsIdRemind = function (body, metadata) {
        return this.core.fetch('/api/v1/documents/{id}/remind', 'post', body, metadata);
    };
    /**
     * Gets a completed document PDF. Supply the unique document ID from either a document
     * creation request or document page URL.
     *
     * @summary Completed PDF
     * @throws FetchError<404, types.GetApiV1DocumentsIdCompletedPdfResponse404> not_found
     */
    SDK.prototype.getApiV1DocumentsIdCompleted_pdf = function (metadata) {
        return this.core.fetch('/api/v1/documents/{id}/completed_pdf/', 'get', metadata);
    };
    /**
     * Returns a template and all associated template data. Supply the unique template ID from
     * either a Create Template request or template page URL.
     *
     * @summary Get Template
     * @throws FetchError<404, types.GetApiV1DocumentTemplatesIdResponse404> not_found
     */
    SDK.prototype.getApiV1Document_templatesId = function (metadata) {
        return this.core.fetch('/api/v1/document_templates/{id}/', 'get', metadata);
    };
    /**
     * Updates an existing template.
     *
     * @summary Update Template
     * @throws FetchError<400, types.PutApiV1DocumentTemplatesIdResponse400> bad request
     * @throws FetchError<422, types.PutApiV1DocumentTemplatesIdResponse422> unprocessable entity
     */
    SDK.prototype.putApiV1Document_templatesId = function (body, metadata) {
        return this.core.fetch('/api/v1/document_templates/{id}/', 'put', body, metadata);
    };
    /**
     * Deletes a template. Supply the unique template ID from either a Create Template request
     * or template page URL.
     *
     * @summary Delete Template
     * @throws FetchError<404, types.DeleteApiV1DocumentTemplatesIdResponse404> not found
     */
    SDK.prototype.deleteApiV1Document_templatesId = function (metadata) {
        return this.core.fetch('/api/v1/document_templates/{id}/', 'delete', metadata);
    };
    /**
     * Creates a new template.
     *
     * @summary Create Template
     * @throws FetchError<400, types.PostApiV1DocumentTemplatesResponse400> bad request
     * @throws FetchError<422, types.PostApiV1DocumentTemplatesResponse422> unprocessable entity
     */
    SDK.prototype.postApiV1Document_templates = function (body) {
        return this.core.fetch('/api/v1/document_templates/', 'post', body);
    };
    /**
     * Gets the details of a specific API Application within an account. Supply the unique
     * Application ID from either the Create API Application response or the API Application
     * edit page.
     *
     * @summary Get API Application
     * @throws FetchError<404, types.GetApiV1ApiApplicationsIdResponse404> not_found
     */
    SDK.prototype.getApiV1Api_applicationsId = function (metadata) {
        return this.core.fetch('/api/v1/api_applications/{id}/', 'get', metadata);
    };
    /**
     * Deletes an API Application from an account. Supply the unique Application ID from either
     * the Create API Application response or the API Application edit page
     *
     * @summary Delete API Application
     * @throws FetchError<404, types.DeleteApiV1ApiApplicationsIdResponse404> not found
     */
    SDK.prototype.deleteApiV1Api_applicationsId = function (metadata) {
        return this.core.fetch('/api/v1/api_applications/{id}/', 'delete', metadata);
    };
    /**
     * List all the webhooks in the account.
     *
     * @summary List Webhooks
     */
    SDK.prototype.getApiV1Hooks = function () {
        return this.core.fetch('/api/v1/hooks/', 'get');
    };
    /**
     * Register a callback URL that we will post document events to.
     *
     * @summary Create Webhook
     * @throws FetchError<400, types.PostApiV1HooksResponse400> bad request
     */
    SDK.prototype.postApiV1Hooks = function (body) {
        return this.core.fetch('/api/v1/hooks/', 'post', body);
    };
    /**
     * Deletes a registered callback URL that we are posting document events to.
     *
     * @summary Delete Webhook
     * @throws FetchError<404, types.DeleteApiV1HooksIdResponse404> not found
     */
    SDK.prototype.deleteApiV1HooksId = function (metadata) {
        return this.core.fetch('/api/v1/hooks/{id}/', 'delete', metadata);
    };
    /**
     * Retrieves the account information associated with the API key being used.
     *
     * @summary Get credentials
     * @throws FetchError<401, types.GetApiV1MeResponse401> unauthorized
     */
    SDK.prototype.getApiV1Me = function () {
        return this.core.fetch('/api/v1/me/', 'get');
    };
    /**
     * Returns information about the Bulk Send.
     *
     * @summary Get Bulk Send
     * @throws FetchError<401, types.GetApiV1BulkSendsIdResponse401> unauthorized
     * @throws FetchError<404, types.GetApiV1BulkSendsIdResponse404> not found
     */
    SDK.prototype.getApiV1Bulk_sendsId = function (metadata) {
        return this.core.fetch('/api/v1/bulk_sends/{id}', 'get', metadata);
    };
    /**
     * Returns information about the Bulk Send.
     *
     * @summary List Bulk Sendings
     * @throws FetchError<401, types.GetApiV1BulkSendsResponse401> unauthorized
     */
    SDK.prototype.getApiV1Bulk_sends = function (metadata) {
        return this.core.fetch('/api/v1/bulk_sends', 'get', metadata);
    };
    /**
     * Creates a bulk send, and it validates the CSV file before creating the bulk send.
     *
     * @summary Create Bulk Send
     * @throws FetchError<401, types.PostApiV1BulkSendsResponse401> unauthorized
     * @throws FetchError<422, types.PostApiV1BulkSendsResponse422> unprocessable entity
     */
    SDK.prototype.postApiV1Bulk_sends = function (body) {
        return this.core.fetch('/api/v1/bulk_sends', 'post', body);
    };
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
    SDK.prototype.getApiV1Bulk_sendsCsv_template = function (metadata) {
        return this.core.fetch('/api/v1/bulk_sends/csv_template', 'get', metadata);
    };
    /**
     * Validates a Bulk Send CSV file before creating the Bulk Send. It will check the
     * structure of the CSV and the data it contains, and return any errors found.
     *
     * @summary Validate Bulk Send CSV
     * @throws FetchError<401, types.PostApiV1BulkSendsValidateCsvResponse401> unauthorized
     * @throws FetchError<422, types.PostApiV1BulkSendsValidateCsvResponse422> unprocessable entity
     */
    SDK.prototype.postApiV1Bulk_sendsValidate_csv = function (body) {
        return this.core.fetch('/api/v1/bulk_sends/validate_csv', 'post', body);
    };
    /**
     * Returns information about the Bulk Send.
     *
     * @summary Get Bulk Send Documents
     * @throws FetchError<401, types.GetApiV1BulkSendsIdDocumentsResponse401> unauthorized
     * @throws FetchError<404, types.GetApiV1BulkSendsIdDocumentsResponse404> not found
     */
    SDK.prototype.getApiV1Bulk_sendsIdDocuments = function (metadata) {
        return this.core.fetch('/api/v1/bulk_sends/{id}/documents', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
