declare const DeleteApiV1ApiApplicationsId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the API Application.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteApiV1DocumentTemplatesId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a template.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteApiV1DocumentsId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a document.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteApiV1HooksId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a webhook.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1ApiApplicationsId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the API Application.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1BulkSends: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly user_email: {
                    readonly type: "string";
                    readonly format: "email";
                    readonly description: "The email address of the user that sent the Bulk Send. Must have the `admin` or `manager` role to view Bulk Sends of other users. Defaults to the user that the API key belongs to.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly maximum: 50;
                    readonly default: 10;
                    readonly description: "The number of documents to fetch. Defaults to 10, max is 50.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly default: 1;
                    readonly description: "The page number for pagination. Defaults to the first page.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly api_application_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1BulkSendsCsvTemplate: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "template_ids[]": {
                    readonly type: "array";
                    readonly description: "Specify one or more templates to generate a single blank CSV file that will contain available columns for your recipient data. The template_ids[] parameter is an array of template IDs (e.g.,`/?template_ids[]=5a67dbd7-928a-4ea0-a7e2-e476a0eb045f&template_ids[]=d7315111-c671-4b15-8354-c9a19bbaefa0`). Each ID should be a separate parameter in the query string.";
                    readonly items: {
                        readonly type: "string";
                        readonly format: "uuid";
                    };
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly base64: {
                    readonly type: "string";
                    readonly format: "byte";
                    readonly description: "A RFC 4648 base64 string of the template CSV file to be validated.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["template_ids[]"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1BulkSendsId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a bulk send.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1BulkSendsIdDocuments: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a bulk send.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly maximum: 50;
                    readonly default: 10;
                    readonly description: "The number of documents to fetch. Defaults to 10, max is 50.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly default: 1;
                    readonly description: "The page number for pagination. Defaults to the first page.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1DocumentTemplatesId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a template.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1DocumentsId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a document.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1DocumentsIdCompletedPdf: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a completed document.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly url_only: {
                    readonly type: "boolean";
                    readonly default: false;
                    readonly description: "Whether to return the URL of the completed PDF or the actual PDF content. Defaults to `false`.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly audit_page: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly description: "Whether to include the audit page as part of the document. Defaults to `true`";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly anyOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly file_url: {
                        readonly type: "string";
                        readonly format: "url";
                    };
                };
            }, {
                readonly type: "string";
                readonly format: "binary";
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1Hooks: {
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetApiV1Me: {
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1BulkSends: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly template_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly description: "Unique identifiers for a list of templates.";
            };
            readonly bulk_send_csv: {
                readonly type: "string";
                readonly format: "byte";
                readonly description: "A RFC 4648 base64 string of the template CSV file to be validated.";
            };
            readonly skip_row_errors: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether to skip errors in the rows. Defaults to `false`.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the Bulk Send. Will be used as the document name for each of the documents.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject.";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly custom_requester_name: {
                readonly type: "string";
                readonly description: "Sets the custom requester name for the document. When set, this is the name used for all email communications, signing notifications, and in the audit file.";
            };
            readonly custom_requester_email: {
                readonly type: "string";
                readonly format: "email";
                readonly description: "Sets the custom requester email for the document. When set, this is the email used for all email communications, signing notifications, and in the audit file.";
            };
        };
        readonly required: readonly ["template_ids", "bulk_send_csv"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1BulkSendsValidateCsv: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly template_ids: {
                readonly type: "array";
                readonly description: "Specify one or more templates to generate a single blank CSV file that will contain available columns for your recipient data. The template_ids[] parameter is an array of template IDs (e.g.,`/?template_ids[]=5a67dbd7-928a-4ea0-a7e2-e476a0eb045f&template_ids[]=d7315111-c671-4b15-8354-c9a19bbaefa0`). Each ID should be a separate parameter in the query string.";
                readonly items: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
            };
            readonly bulk_send_csv: {
                readonly type: "string";
                readonly format: "byte";
                readonly description: "A RFC 4648 base64 string of the template CSV file to be validated.";
            };
        };
        readonly required: readonly ["template_ids", "bulk_send_csv"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1DocumentTemplates: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly files: {
                readonly type: "array";
                readonly description: "Document files can be uploaded by specifying a file URL or base64 string. Either `file_url` or `file_base64` must be present (not both). Valid file types are: .pdf, .doc, .docx, .pages, .ppt, .pptx, .key, .xls, .xlsx, .numbers, .jpg, .jpeg, .png, .tiff, .tif, and .webp";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the file that will be uploaded.";
                        };
                        readonly file_url: {
                            readonly type: "string";
                            readonly format: "url";
                            readonly description: "Publicly available URL of the file to be uploaded.";
                        };
                        readonly file_base64: {
                            readonly type: "string";
                            readonly format: "byte";
                            readonly description: "A RFC 4648 base64 string of the file to be uploaded.";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the template.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject (if the document is created from a template).";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message (if the document is created from a template).";
            };
            readonly placeholders: {
                readonly type: "array";
                readonly description: "Placeholders are generally job roles that must complete and/or sign the document. For example, a placeholder might be “Client” or “Legal Department”. When a document is created from the template, you assign a person to each placeholder.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly description: "A unique identifier that you will give to each placeholder. We recommend numbering sequentially from 1 to X. IDs are required for associating recipients to fields and more.";
                        };
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the placeholder.";
                        };
                        readonly preassigned_recipient_name: {
                            readonly type: "string";
                            readonly description: "In some cases, it may be necessary to pre-fill the name and email for a placeholder because it will always be the same person for all documents created from this template. This sets the name.";
                        };
                        readonly preassigned_recipient_email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "In some cases, it may be necessary to pre-fill the name and email for a placeholder because it will always be the same person for all documents created from this template. This sets the email.";
                        };
                    };
                    readonly required: readonly ["id", "name"];
                };
            };
            readonly copied_placeholders: {
                readonly type: "array";
                readonly description: "Copied placeholders are emailed the final document once it has been completed by all recipients.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the placeholder.";
                        };
                        readonly preassigned_recipient_name: {
                            readonly type: "string";
                            readonly description: "In some cases, it may be necessary to pre-fill the name and email for a placeholder because it will always be the same person for all documents created from this template. This sets the name.";
                        };
                        readonly preassigned_recipient_email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "In some cases, it may be necessary to pre-fill the name and email for a placeholder because it will always be the same person for all documents created from this template. This sets the email.";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly draft: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether the template can still be updated before it is ready for usage. If set to `false` the template is marked as `Available` and it will be ready for use. Defaults to `false`.";
            };
            readonly expires_in: {
                readonly type: "integer";
                readonly minimum: 1;
                readonly description: "Number of days before the signature request expires. Defaults to the account expiration setting or template expiration (if the document is created from a template).";
            };
            readonly reminders: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to send signing reminders to recipients. Reminders are sent on day 3, day 6, and day 10 if set to `true`. Defaults to `true`.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly text_tags: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "An alternative way (if you can’t use the recommended way) of placing fields in specific locations of your document by using special text tags. Useful when changing the content of your files changes the location of fields. See API documentation for “Text Tags” for details. Defaults to false.";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to after successfully signing a document.";
            };
            readonly allow_decline: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to allow recipients the option to decline signing a document. If multiple signers are involved in a document, any single recipient can cancel the entire document signing process by declining to sign.";
            };
            readonly allow_reassign: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "In some cases a signer is not the right person to sign and may need to reassign their signing responsibilities to another person. This feature allows them to reassign the document to someone else.";
            };
            readonly decline_redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to if the document is declined.";
            };
            readonly metadata: {
                readonly type: "object";
                readonly description: "Optional key-value data that can be associated with the document. If set, will be available every time the document data is returned.";
                readonly additionalProperties: true;
            };
            readonly fields: {
                readonly type: "array";
                readonly description: "Document fields placed on a document for collecting data or signatures from recipients. At least one field must be present in the Create Document request if `draft` is `false` (unless adding a signature page by using `with_signature_page`). Field data should be sent as a 2-dimensional JSON array. One array of fields is needed for each file in the files array. An array of fields can be empty if you have a file that does not contain any fields.";
                readonly items: {
                    readonly type: "array";
                    readonly description: "Array of Fields you're adding to each file.";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly x: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Horizontal value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly y: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Vertical value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly page: {
                                readonly type: "integer";
                                readonly description: "The page number within the file. If the page does not exist within the file then the field won't be created.";
                            };
                            readonly placeholder_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the placeholder assigned to the field.";
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly enum: readonly ["initials", "signature", "checkbox", "date", "text", "autofill_company", "autofill_email", "autofill_first_name", "autofill_last_name", "autofill_name", "autofill_phone", "autofill_title", "autofill_date_signed"];
                                readonly description: "Field type of the field. Valid field types: initials, signatures, checkbox, date, and text. To autofill fields with contact data, use an autofill field type. To group checkbox fields, enter an api_id for each checkbox and add the checkbox_groups parameter.";
                            };
                            readonly required: {
                                readonly type: "boolean";
                                readonly default: true;
                                readonly description: "Whether the field must be completed by the recipient. Defaults to `true` except for checkbox type fields.";
                            };
                            readonly label: {
                                readonly type: "string";
                                readonly description: "Text and Date fields only: label that is displayed when the field is empty.";
                            };
                            readonly value: {
                                readonly description: "Varies according to the field type. Text fields accept strings or numbers. Date fields accept Iso8601 date strings. CheckBoxes accept booleans. Signature and Initials fields can't be signed through API requests. Autofill text fields accept strings or numbers.";
                            };
                            readonly api_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the field. Useful when needing to reference specific field values or update a document and its fields.";
                            };
                            readonly validation: {
                                readonly type: "string";
                                readonly enum: readonly ["no_text_validation", "numbers", "letters", "email_address", "us_phone_number", "us_zip_code", "us_ssn", "us_age", "alphanumeric", "us_bank_routing_number", "us_bank_account_number"];
                                readonly description: "Text fields only: optional validation for field values. Valid values: numbers, letters, email_address, us_phone_number, us_zip_code, us_ssn, us_age, alphanumeric, us_bank_routing_number, us_bank_account.";
                            };
                            readonly fixed_width: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Text fields only: whether the field width will stay fixed and text will display in multiple lines, rather than one long line. If set to `false` the field width will automatically grow horizontally to fit text on one line. Defaults to `false`.";
                            };
                            readonly lock_sign_date: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Date fields only: makes fields readonly and automatically populates with the date the recipient signed. Defaults to `false`.";
                            };
                            readonly date_format: {
                                readonly type: "string";
                                readonly enum: readonly ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "Month DD, YYYY", "MM/DD/YYYY hh:mm:ss a"];
                                readonly description: "Date fields only: date format to use for the field. Valid values: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD, Month DD, YYYY, and MM/DD/YYYY hh:mm:ss a. Defaults to MM/DD/YYYY.";
                            };
                        };
                        readonly required: readonly ["x", "y", "page", "placeholder_id", "type"];
                    };
                };
            };
            readonly attachment_requests: {
                readonly type: "array";
                readonly description: "Attachments that a recipient must upload to complete the signing process. Attachment requests are shown after all document fields have been completed.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the requested attachment.";
                        };
                        readonly placeholder_id: {
                            readonly type: "string";
                            readonly description: "Unique identifier of the recipient that will view the attachment request.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: true;
                            readonly description: "Whether the recipient will need to upload the attachment to successfully complete/sign the document. Defaults to `true`.";
                        };
                    };
                    readonly required: readonly ["name", "placeholder_id"];
                };
            };
            readonly labels: {
                readonly type: "array";
                readonly description: "Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell. A document can have multiple labels.";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Labels can be used to organize documents and templates in a way that can make it easy to find using the document search/template search in SignWell. Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly checkbox_groups: {
                readonly type: "array";
                readonly description: "Checkbox fields that are placed on a document can be grouped with selection requirements. At least 2 checkbox fields in an array of fields must be assigned to the same recipient.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly group_name: {
                            readonly type: "string";
                            readonly description: "A unique identifier for the checkbox group.";
                        };
                        readonly placeholder_id: {
                            readonly type: "string";
                            readonly description: "The recipient ID associated with the checkbox group.";
                        };
                        readonly checkbox_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly description: "A unique identifier for each checkbox in a group. ID must match the api_id of the checkbox field.";
                            };
                        };
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: readonly ["minimum", "maximum", "range", "exact"];
                            readonly description: "Set requirements for the group of one or multiple selections by the recipient. Defaults to minimum. Validation values: minimum, maximum, exact, range.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Whether the group must be completed by the recipient. Defaults to false.";
                        };
                        readonly min_value: {
                            readonly type: "integer";
                            readonly description: "The minimum number of checkboxes that must be checked in the group. (Only for validation: minimum and range)";
                        };
                        readonly max_value: {
                            readonly type: "integer";
                            readonly description: "The maximum number of checkboxes that can be checked in the group. (Only for validation: maximum and range)";
                        };
                        readonly exact_value: {
                            readonly type: "integer";
                            readonly description: "The exact number of checkboxes that must be checked in the group. (Only for validation: exact)";
                        };
                    };
                    readonly required: readonly ["group_name", "recipient_id", "checkbox_ids"];
                };
            };
        };
        readonly required: readonly ["files", "placeholders"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1DocumentTemplatesDocuments: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly test_mode: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Set to `true` to enable Test Mode. Documents created with Test Mode do not count towards API billing and are not legally binding. Defaults to `false`";
            };
            readonly template_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Use when you have to create a document from a single template. Either :template_id or :template_ids must be present in the request, not both.";
            };
            readonly template_ids: {
                readonly type: "array";
                readonly description: "Use when you have to create a document from multiple templates. Either :template_id or :template_ids must be present in the request, not both.";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the document.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject (if the document is created from a template).";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message (if the document is created from a template).";
            };
            readonly recipients: {
                readonly type: "array";
                readonly description: "Document recipients are people that must complete and/or sign a document. Recipients of the document must be assigned to a placeholder of the template. Recipients will inherit all placeholder fields and settings.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly description: "A unique identifier that you will give to each recipient. We recommend numbering sequentially from 1 to X. IDs are required for associating recipients to fields and more.";
                        };
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the recipient.";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "Email address for the recipient.";
                        };
                        readonly placeholder_name: {
                            readonly type: "string";
                            readonly description: "The name of the placeholder you want this recipient assigned to.";
                        };
                        readonly passcode: {
                            readonly type: "string";
                            readonly description: "If set, signers assigned with a passcode will be required to enter the passcode before they’re able to view and complete the document.";
                        };
                        readonly subject: {
                            readonly type: "string";
                            readonly description: "Email subject for the signature request that the recipient will see. Overrides the general subject for the template.";
                        };
                        readonly message: {
                            readonly type: "string";
                            readonly description: "Email message for the signature request that the recipient will see. Overrides the general message for the template.";
                        };
                        readonly send_email: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Applies on when `embedded_signing` is `true`. By default, recipients are not notified through email to sign when doing embedded signing. Setting this to `true`  will send a notification email to the recipient. Default is `false`.";
                        };
                        readonly send_email_delay: {
                            readonly type: "integer";
                            readonly default: 0;
                            readonly description: "If `send_email` is `true` recipients will receive a new document notification immediately. In the case of embedded signing, you can delay this notification to only send if the document is not completed within a few minutes. The email notification will not go out if the document is completed before the delay time is over. Valid values are in minutes ranging from `0` to `60`. Defaults to `0`.";
                        };
                    };
                    readonly required: readonly ["id", "email"];
                };
            };
            readonly draft: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether the document can still be updated before sending a signature request. If set to `false` the document is sent for signing as part of this request. Defaults to `false`.";
            };
            readonly with_signature_page: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` the document will have a signature page added to the end, and all signers will be required to add their signature on that page.";
            };
            readonly expires_in: {
                readonly type: "integer";
                readonly minimum: 1;
                readonly description: "Number of days before the signature request expires. Defaults to the account expiration setting or template expiration (if the document is created from a template).";
            };
            readonly reminders: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to send signing reminders to recipients. Reminders are sent on day 3, day 6, and day 10 if set to `true`. Defaults to `true`.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly embedded_signing: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` it enables embedded signing in your website/web application. Embedded functionality works with an iFrame and email authentication is disabled. :embedded_signinig defaults to `false`.";
            };
            readonly embedded_signing_notifications: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "On embedding signing, document owners (and CC'd contacts) do not get a notification email when documents have been completed. Setting this param to `true` will send out those final completed notifications. Default is `false`";
            };
            readonly text_tags: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "An alternative way (if you can’t use the recommended way) of placing fields in specific locations of your document by using special text tags. Useful when changing the content of your files changes the location of fields. See API documentation for “Text Tags” for details. Defaults to false.";
            };
            readonly custom_requester_name: {
                readonly type: "string";
                readonly description: "Sets the custom requester name for the document. When set, this is the name used for all email communications, signing notifications, and in the audit file.";
            };
            readonly custom_requester_email: {
                readonly type: "string";
                readonly format: "email";
                readonly description: "Sets the custom requester email for the document. When set, this is the email used for all email communications, signing notifications, and in the audit file.";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to after successfully signing a document.";
            };
            readonly allow_decline: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to allow recipients the option to decline signing a document. If multiple signers are involved in a document, any single recipient can cancel the entire document signing process by declining to sign.";
            };
            readonly allow_reassign: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "In some cases a signer is not the right person to sign and may need to reassign their signing responsibilities to another person. This feature allows them to reassign the document to someone else.";
            };
            readonly decline_redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to if the document is declined.";
            };
            readonly metadata: {
                readonly type: "object";
                readonly description: "Optional key-value data that can be associated with the document. If set, will be available every time the document data is returned.";
                readonly additionalProperties: true;
            };
            readonly template_fields: {
                readonly type: "array";
                readonly description: "Fields of your template(s) that you can prepopulate with values. Signature and Initials fields cannot be signed through the API.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly api_id: {
                            readonly type: "string";
                            readonly description: "The API ID of the field in your template. This field is case sensitive.";
                        };
                        readonly value: {
                            readonly description: "TextField value must be a string or a number.";
                        };
                    };
                    readonly required: readonly ["api_id", "value"];
                };
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Additional files to be appended to the document. Will not replace existing files from the template. Document files can be uploaded by specifying a file URL or base64 string. Either `file_url` or `file_base64` must be present (not both). Valid file types are: .pdf, .docx, .jpg, .png, .ppt, .xls, .pages, and .txt.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the file that will be uploaded.";
                        };
                        readonly file_url: {
                            readonly type: "string";
                            readonly format: "url";
                            readonly description: "Publicly available URL of the file to be uploaded.";
                        };
                        readonly file_base64: {
                            readonly type: "string";
                            readonly format: "byte";
                            readonly description: "A RFC 4648 base64 string of the file to be uploaded.";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly fields: {
                readonly type: "array";
                readonly description: "Fields to be added to any appended files (not existing files). Document fields placed on a document for collecting data or signatures from recipients. Field data should be sent as a 2-dimensional JSON array. One array of fields is needed for each file in the files array. An array of fields can be empty if you have a file that does not contain any fields.";
                readonly items: {
                    readonly type: "array";
                    readonly description: "Array of Fields you're adding to each file.";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly x: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Horizontal value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly y: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Vertical value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly page: {
                                readonly type: "integer";
                                readonly description: "The page number within the file. If the page does not exist within the file then the field won't be created.";
                            };
                            readonly recipient_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the recipient assigned to the field. Recipients assigned to fields will be the only ones that will see and be able to complete those fields.";
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly enum: readonly ["initials", "signature", "checkbox", "date", "text", "autofill_company", "autofill_email", "autofill_first_name", "autofill_last_name", "autofill_name", "autofill_phone", "autofill_title", "autofill_date_signed"];
                                readonly description: "Field type of the field. Valid field types: initials, signatures, checkbox, date, and text. To autofill fields with contact data, use an autofill field type. To group checkbox fields, enter an api_id for each checkbox and add the checkbox_groups parameter.";
                            };
                            readonly required: {
                                readonly type: "boolean";
                                readonly default: true;
                                readonly description: "Whether the field must be completed by the recipient. Defaults to `true` except for checkbox type fields.";
                            };
                            readonly label: {
                                readonly type: "string";
                                readonly description: "Text and Date fields only: label that is displayed when the field is empty.";
                            };
                            readonly value: {
                                readonly description: "Varies according to the field type. Text fields accept strings or numbers. Date fields accept Iso8601 date strings. CheckBoxes accept booleans. Signature and Initials fields can't be signed through API requests. Autofill text fields accept strings or numbers.";
                            };
                            readonly api_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the field. Useful when needing to reference specific field values or update a document and its fields.";
                            };
                            readonly validation: {
                                readonly type: "string";
                                readonly enum: readonly ["no_text_validation", "numbers", "letters", "email_address", "us_phone_number", "us_zip_code", "us_ssn", "us_age", "alphanumeric", "us_bank_routing_number", "us_bank_account_number"];
                                readonly description: "Text fields only: optional validation for field values. Valid values: numbers, letters, email_address, us_phone_number, us_zip_code, us_ssn, us_age, alphanumeric, us_bank_routing_number, us_bank_account.";
                            };
                            readonly fixed_width: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Text fields only: whether the field width will stay fixed and text will display in multiple lines, rather than one long line. If set to `false` the field width will automatically grow horizontally to fit text on one line. Defaults to `false`.";
                            };
                            readonly lock_sign_date: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Date fields only: makes fields readonly and automatically populates with the date the recipient signed. Defaults to `false`.";
                            };
                            readonly date_format: {
                                readonly type: "string";
                                readonly enum: readonly ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "Month DD, YYYY", "MM/DD/YYYY hh:mm:ss a"];
                                readonly description: "Date fields only: date format to use for the field. Valid values: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD, Month DD, YYYY, and MM/DD/YYYY hh:mm:ss a. Defaults to MM/DD/YYYY.";
                            };
                        };
                        readonly required: readonly ["x", "y", "page", "recipient_id", "type"];
                    };
                };
            };
            readonly attachment_requests: {
                readonly type: "array";
                readonly description: "Attachments that a recipient must upload to complete the signing process. Attachment requests are shown after all document fields have been completed.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the requested attachment.";
                        };
                        readonly recipient_id: {
                            readonly type: "string";
                            readonly description: "Unique identifier of the recipient that will view the attachment request.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: true;
                            readonly description: "Whether the recipient will need to upload the attachment to successfully complete/sign the document. Defaults to `true`.";
                        };
                    };
                    readonly required: readonly ["name", "recipient_id"];
                };
            };
            readonly copied_contacts: {
                readonly type: "array";
                readonly description: "Copied contacts are emailed the final document once it has been completed by all recipients.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the copied contact.";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "Email for the copied contact.";
                        };
                    };
                    readonly required: readonly ["email"];
                };
            };
            readonly labels: {
                readonly type: "array";
                readonly description: "Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell. A document can have multiple labels. Updating labels on a document will replace any existing labels for that document.";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Labels can be used to organize documents and templates in a way that can make it easy to find using the document search/template search in SignWell. Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly checkbox_groups: {
                readonly type: "array";
                readonly description: "Checkbox fields that are placed on a document can be grouped with selection requirements. At least 2 checkbox fields in an array of fields must be assigned to the same recipient.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly group_name: {
                            readonly type: "string";
                            readonly description: "A unique identifier for the checkbox group.";
                        };
                        readonly recipient_id: {
                            readonly type: "string";
                            readonly description: "The recipient ID associated with the checkbox group.";
                        };
                        readonly checkbox_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly description: "A unique identifier for each checkbox in a group. ID must match the api_id of the checkbox field.";
                            };
                        };
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: readonly ["minimum", "maximum", "range", "exact"];
                            readonly description: "Set requirements for the group of one or multiple selections by the recipient. Defaults to minimum. Validation values: minimum, maximum, exact, range.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Whether the group must be completed by the recipient. Defaults to false.";
                        };
                        readonly min_value: {
                            readonly type: "integer";
                            readonly description: "The minimum number of checkboxes that must be checked in the group. (Only for validation: minimum and range)";
                        };
                        readonly max_value: {
                            readonly type: "integer";
                            readonly description: "The maximum number of checkboxes that can be checked in the group. (Only for validation: maximum and range)";
                        };
                        readonly exact_value: {
                            readonly type: "integer";
                            readonly description: "The exact number of checkboxes that must be checked in the group. (Only for validation: exact)";
                        };
                    };
                    readonly required: readonly ["group_name", "recipient_id", "checkbox_ids"];
                };
            };
        };
        readonly required: readonly ["recipients"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1Documents: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly test_mode: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Set to `true` to enable Test Mode. Documents created with Test Mode do not count towards API billing and are not legally binding. Defaults to `false`";
            };
            readonly files: {
                readonly type: "array";
                readonly description: "Document files can be uploaded by specifying a file URL or base64 string. Either `file_url` or `file_base64` must be present (not both). Valid file types are: .pdf, .doc, .docx, .pages, .ppt, .pptx, .key, .xls, .xlsx, .numbers, .jpg, .jpeg, .png, .tiff, .tif, and .webp";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the file that will be uploaded.";
                        };
                        readonly file_url: {
                            readonly type: "string";
                            readonly format: "url";
                            readonly description: "Publicly available URL of the file to be uploaded.";
                        };
                        readonly file_base64: {
                            readonly type: "string";
                            readonly format: "byte";
                            readonly description: "A RFC 4648 base64 string of the file to be uploaded.";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the document.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject (if the document is created from a template).";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message (if the document is created from a template).";
            };
            readonly recipients: {
                readonly type: "array";
                readonly description: "Document recipients are people that must complete and/or sign a document.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly description: "A unique identifier that you will give to each recipient. We recommend numbering sequentially from 1 to X. IDs are required for associating recipients to fields and more.";
                        };
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the recipient.";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "Email address for the recipient.";
                        };
                        readonly passcode: {
                            readonly type: "string";
                            readonly description: "If set, signers assigned with a passcode will be required to enter the passcode before they’re able to view and complete the document.";
                        };
                        readonly subject: {
                            readonly type: "string";
                            readonly description: "Email subject for the signature request that the recipient will see. Overrides the general subject for the document.";
                        };
                        readonly message: {
                            readonly type: "string";
                            readonly description: "Email message for the signature request that the recipient will see. Overrides the general message for the document.";
                        };
                        readonly send_email: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Applies on when `embedded_signing` is `true`. By default, recipients are not notified through email to sign when doing embedded signing. Setting this to `true`  will send a notification email to the recipient. Default is `false`.";
                        };
                        readonly send_email_delay: {
                            readonly type: "integer";
                            readonly default: 0;
                            readonly description: "If `send_email` is `true` recipients will receive a new document notification immediately. In the case of embedded signing, you can delay this notification to only send if the document is not completed within a few minutes. The email notification will not go out if the document is completed before the delay time is over. Valid values are in minutes ranging from `0` to `60`. Defaults to `0`.";
                        };
                    };
                    readonly required: readonly ["id", "email"];
                };
            };
            readonly draft: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether the document can still be updated before sending a signature request. If set to `false` the document is sent for signing as part of this request. Defaults to `false`.";
            };
            readonly with_signature_page: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` the document will have a signature page added to the end, and all signers will be required to add their signature on that page.";
            };
            readonly expires_in: {
                readonly type: "integer";
                readonly minimum: 1;
                readonly description: "Number of days before the signature request expires. Defaults to the account expiration setting or template expiration (if the document is created from a template).";
            };
            readonly reminders: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to send signing reminders to recipients. Reminders are sent on day 3, day 6, and day 10 if set to `true`. Defaults to `true`.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly embedded_signing: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` it enables embedded signing in your website/web application. Embedded functionality works with an iFrame and email authentication is disabled. :embedded_signinig defaults to `false`.";
            };
            readonly embedded_signing_notifications: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "On embedding signing, document owners (and CC'd contacts) do not get a notification email when documents have been completed. Setting this param to `true` will send out those final completed notifications. Default is `false`";
            };
            readonly text_tags: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "An alternative way (if you can’t use the recommended way) of placing fields in specific locations of your document by using special text tags. Useful when changing the content of your files changes the location of fields. See API documentation for “Text Tags” for details. Defaults to false.";
            };
            readonly custom_requester_name: {
                readonly type: "string";
                readonly description: "Sets the custom requester name for the document. When set, this is the name used for all email communications, signing notifications, and in the audit file.";
            };
            readonly custom_requester_email: {
                readonly type: "string";
                readonly format: "email";
                readonly description: "Sets the custom requester email for the document. When set, this is the email used for all email communications, signing notifications, and in the audit file.";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to after successfully signing a document.";
            };
            readonly allow_decline: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to allow recipients the option to decline signing a document. If multiple signers are involved in a document, any single recipient can cancel the entire document signing process by declining to sign.";
            };
            readonly allow_reassign: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "In some cases a signer is not the right person to sign and may need to reassign their signing responsibilities to another person. This feature allows them to reassign the document to someone else.";
            };
            readonly decline_redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to if the document is declined.";
            };
            readonly metadata: {
                readonly type: "object";
                readonly description: "Optional key-value data that can be associated with the document. If set, will be available every time the document data is returned.";
                readonly additionalProperties: true;
            };
            readonly fields: {
                readonly type: "array";
                readonly description: "Document fields placed on a document for collecting data or signatures from recipients. At least one field must be present in the Create Document request if `draft` is `false` (unless adding a signature page by using `with_signature_page`). Field data should be sent as a 2-dimensional JSON array. One array of fields is needed for each file in the files array. An array of fields can be empty if you have a file that does not contain any fields.";
                readonly items: {
                    readonly type: "array";
                    readonly description: "Array of Fields you're adding to each file.";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly x: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Horizontal value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly y: {
                                readonly type: "number";
                                readonly format: "float";
                                readonly description: "Vertical value in the coordinates of the field (in pixels). Coordinates are specific to the page where fields are located.";
                                readonly minimum: -3.402823669209385e+38;
                                readonly maximum: 3.402823669209385e+38;
                            };
                            readonly page: {
                                readonly type: "integer";
                                readonly description: "The page number within the file. If the page does not exist within the file then the field won't be created.";
                            };
                            readonly recipient_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the recipient assigned to the field. Recipients assigned to fields will be the only ones that will see and be able to complete those fields.";
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly enum: readonly ["initials", "signature", "checkbox", "date", "text", "autofill_company", "autofill_email", "autofill_first_name", "autofill_last_name", "autofill_name", "autofill_phone", "autofill_title", "autofill_date_signed"];
                                readonly description: "Field type of the field. Valid field types: initials, signatures, checkbox, date, and text. To autofill fields with contact data, use an autofill field type. To group checkbox fields, enter an api_id for each checkbox and add the checkbox_groups parameter.";
                            };
                            readonly required: {
                                readonly type: "boolean";
                                readonly default: true;
                                readonly description: "Whether the field must be completed by the recipient. Defaults to `true` except for checkbox type fields.";
                            };
                            readonly label: {
                                readonly type: "string";
                                readonly description: "Text and Date fields only: label that is displayed when the field is empty.";
                            };
                            readonly value: {
                                readonly description: "Varies according to the field type. Text fields accept strings or numbers. Date fields accept Iso8601 date strings. CheckBoxes accept booleans. Signature and Initials fields can't be signed through API requests. Autofill text fields accept strings or numbers.";
                            };
                            readonly api_id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the field. Useful when needing to reference specific field values or update a document and its fields.";
                            };
                            readonly validation: {
                                readonly type: "string";
                                readonly enum: readonly ["no_text_validation", "numbers", "letters", "email_address", "us_phone_number", "us_zip_code", "us_ssn", "us_age", "alphanumeric", "us_bank_routing_number", "us_bank_account_number"];
                                readonly description: "Text fields only: optional validation for field values. Valid values: numbers, letters, email_address, us_phone_number, us_zip_code, us_ssn, us_age, alphanumeric, us_bank_routing_number, us_bank_account.";
                            };
                            readonly fixed_width: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Text fields only: whether the field width will stay fixed and text will display in multiple lines, rather than one long line. If set to `false` the field width will automatically grow horizontally to fit text on one line. Defaults to `false`.";
                            };
                            readonly lock_sign_date: {
                                readonly type: "boolean";
                                readonly default: false;
                                readonly description: "Date fields only: makes fields readonly and automatically populates with the date the recipient signed. Defaults to `false`.";
                            };
                            readonly date_format: {
                                readonly type: "string";
                                readonly enum: readonly ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "Month DD, YYYY", "MM/DD/YYYY hh:mm:ss a"];
                                readonly description: "Date fields only: date format to use for the field. Valid values: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD, Month DD, YYYY, and MM/DD/YYYY hh:mm:ss a. Defaults to MM/DD/YYYY.";
                            };
                            readonly formula: {
                                readonly type: "string";
                                readonly description: "Date fields only (text field formulas coming soon): formulas are a way to prefill fields with calculated future or past dates. Addition, subtraction, and parentheses are allowed. Valid event dates are `created_date`, `sent_date`, and `signed_date`. Valid time periods are `day`, `days`, `week`, `weeks`, `month`, and `months`. Example: `formula: \"sent_date + 10 days\"`. Use with `lock_sign_date` if you'd like to make the field readonly and prevent signers from choosing a different date.";
                            };
                        };
                        readonly required: readonly ["x", "y", "page", "recipient_id", "type"];
                    };
                };
            };
            readonly attachment_requests: {
                readonly type: "array";
                readonly description: "Attachments that a recipient must upload to complete the signing process. Attachment requests are shown after all document fields have been completed.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the requested attachment.";
                        };
                        readonly recipient_id: {
                            readonly type: "string";
                            readonly description: "Unique identifier of the recipient that will view the attachment request.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: true;
                            readonly description: "Whether the recipient will need to upload the attachment to successfully complete/sign the document. Defaults to `true`.";
                        };
                    };
                    readonly required: readonly ["name", "recipient_id"];
                };
            };
            readonly copied_contacts: {
                readonly type: "array";
                readonly description: "Copied contacts are emailed the final document once it has been completed by all recipients.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Name of the copied contact.";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "Email for the copied contact.";
                        };
                    };
                    readonly required: readonly ["email"];
                };
            };
            readonly labels: {
                readonly type: "array";
                readonly description: "Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell. A document can have multiple labels.";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Labels can be used to organize documents and templates in a way that can make it easy to find using the document search/template search in SignWell. Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly checkbox_groups: {
                readonly type: "array";
                readonly description: "Checkbox fields that are placed on a document can be grouped with selection requirements. At least 2 checkbox fields in an array of fields must be assigned to the same recipient.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly group_name: {
                            readonly type: "string";
                            readonly description: "A unique identifier for the checkbox group.";
                        };
                        readonly recipient_id: {
                            readonly type: "string";
                            readonly description: "The recipient ID associated with the checkbox group.";
                        };
                        readonly checkbox_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly description: "A unique identifier for each checkbox in a group. ID must match the api_id of the checkbox field.";
                            };
                        };
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: readonly ["minimum", "maximum", "range", "exact"];
                            readonly description: "Set requirements for the group of one or multiple selections by the recipient. Defaults to minimum. Validation values: minimum, maximum, exact, range.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Whether the group must be completed by the recipient. Defaults to false.";
                        };
                        readonly min_value: {
                            readonly type: "integer";
                            readonly description: "The minimum number of checkboxes that must be checked in the group. (Only for validation: minimum and range)";
                        };
                        readonly max_value: {
                            readonly type: "integer";
                            readonly description: "The maximum number of checkboxes that can be checked in the group. (Only for validation: maximum and range)";
                        };
                        readonly exact_value: {
                            readonly type: "integer";
                            readonly description: "The exact number of checkboxes that must be checked in the group. (Only for validation: exact)";
                        };
                    };
                    readonly required: readonly ["group_name", "recipient_id", "checkbox_ids"];
                };
            };
        };
        readonly required: readonly ["files", "recipients"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1DocumentsIdRemind: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly recipients: {
                readonly type: "array";
                readonly description: "Optional list if recipients within the document to send a reminder email to. If none are specified, all recipients that have not signed yet will receive a reminder email.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Recipient's name (required if multiple recipients share the same email).";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly format: "email";
                            readonly description: "Recipient's email address.";
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a document.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1DocumentsIdSend: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly test_mode: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Set to `true` to enable Test Mode. Documents created with Test Mode do not count towards API billing and are not legally binding. Defaults to `false`";
            };
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the document.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject (if the document is created from a template).";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message (if the document is created from a template).";
            };
            readonly expires_in: {
                readonly type: "integer";
                readonly minimum: 1;
                readonly description: "Number of days before the signature request expires. Defaults to the account expiration setting or template expiration (if the document is created from a template).";
            };
            readonly reminders: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to send signing reminders to recipients. Reminders are sent on day 3, day 6, and day 10 if set to `true`. Defaults to `true`.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly embedded_signing: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` it enables embedded signing in your website/web application. Embedded functionality works with an iFrame and email authentication is disabled. :embedded_signinig defaults to `false`.";
            };
            readonly embedded_signing_notifications: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "On embedding signing, document owners (and CC'd contacts) do not get a notification email when documents have been completed. Setting this param to `true` will send out those final completed notifications. Default is `false`";
            };
            readonly custom_requester_name: {
                readonly type: "string";
                readonly description: "Sets the custom requester name for the document. When set, this is the name used for all email communications, signing notifications, and in the audit file.";
            };
            readonly custom_requester_email: {
                readonly type: "string";
                readonly format: "email";
                readonly description: "Sets the custom requester email for the document. When set, this is the email used for all email communications, signing notifications, and in the audit file.";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to after successfully signing a document.";
            };
            readonly allow_decline: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to allow recipients the option to decline signing a document. If multiple signers are involved in a document, any single recipient can cancel the entire document signing process by declining to sign.";
            };
            readonly allow_reassign: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "In some cases a signer is not the right person to sign and may need to reassign their signing responsibilities to another person. This feature allows them to reassign the document to someone else.";
            };
            readonly decline_redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to if the document is declined.";
            };
            readonly metadata: {
                readonly type: "object";
                readonly description: "Optional key-value data that can be associated with the document. If set, will be available every time the document data is returned.";
                readonly additionalProperties: true;
            };
            readonly labels: {
                readonly type: "array";
                readonly description: "Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell. A document can have multiple labels. Updating labels on a document will replace any existing labels for that document.";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Labels can be used to organize documents and templates in a way that can make it easy to find using the document search/template search in SignWell. Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly checkbox_groups: {
                readonly type: "array";
                readonly description: "Checkbox fields that are placed on a document can be grouped with selection requirements. At least 2 checkbox fields in an array of fields must be assigned to the same recipient.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly group_name: {
                            readonly type: "string";
                            readonly description: "A unique identifier for the checkbox group.";
                        };
                        readonly recipient_id: {
                            readonly type: "string";
                            readonly description: "The recipient ID associated with the checkbox group.";
                        };
                        readonly checkbox_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly description: "A unique identifier for each checkbox in a group. ID must match the api_id of the checkbox field.";
                            };
                        };
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: readonly ["minimum", "maximum", "range", "exact"];
                            readonly description: "Set requirements for the group of one or multiple selections by the recipient. Defaults to minimum. Validation values: minimum, maximum, exact, range.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Whether the group must be completed by the recipient. Defaults to false.";
                        };
                        readonly min_value: {
                            readonly type: "integer";
                            readonly description: "The minimum number of checkboxes that must be checked in the group. (Only for validation: minimum and range)";
                        };
                        readonly max_value: {
                            readonly type: "integer";
                            readonly description: "The maximum number of checkboxes that can be checked in the group. (Only for validation: maximum and range)";
                        };
                        readonly exact_value: {
                            readonly type: "integer";
                            readonly description: "The exact number of checkboxes that must be checked in the group. (Only for validation: exact)";
                        };
                    };
                    readonly required: readonly ["group_name", "recipient_id", "checkbox_ids"];
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a document.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostApiV1Hooks: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly callback_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "URL that we will post document events to.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for the API Application.";
            };
        };
        readonly required: readonly ["callback_url"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PutApiV1DocumentTemplatesId: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the template.";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject for the signature request that recipients will see. Defaults to the default system subject or a template subject (if the document is created from a template).";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message for the signature request that recipients will see. Defaults to the default system message or a template message (if the document is created from a template).";
            };
            readonly draft: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether the template can still be updated before it is ready for usage. If set to `false` the template is marked as `Available` and it will be ready for use. Defaults to `false`.";
            };
            readonly expires_in: {
                readonly type: "integer";
                readonly minimum: 1;
                readonly description: "Number of days before the signature request expires. Defaults to the account expiration setting or template expiration (if the document is created from a template).";
            };
            readonly reminders: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to send signing reminders to recipients. Reminders are sent on day 3, day 6, and day 10 if set to `true`. Defaults to `true`.";
            };
            readonly apply_signing_order: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "When set to `true` recipients will sign one at a time in the order of the `recipients` collection of this request.";
            };
            readonly api_application_id: {
                readonly type: "string";
                readonly format: "uuid";
                readonly description: "Unique identifier for API Application settings to use. API Applications are optional and mainly used when isolating OAuth apps or for more control over embedded API settings";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to after successfully signing a document.";
            };
            readonly allow_decline: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to allow recipients the option to decline signing a document. If multiple signers are involved in a document, any single recipient can cancel the entire document signing process by declining to sign.";
            };
            readonly allow_reassign: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "In some cases a signer is not the right person to sign and may need to reassign their signing responsibilities to another person. This feature allows them to reassign the document to someone else.";
            };
            readonly decline_redirect_url: {
                readonly type: "string";
                readonly format: "url";
                readonly description: "A URL that recipients are redirected to if the document is declined.";
            };
            readonly metadata: {
                readonly type: "object";
                readonly description: "Optional key-value data that can be associated with the document. If set, will be available every time the document data is returned.";
                readonly additionalProperties: true;
            };
            readonly labels: {
                readonly type: "array";
                readonly description: "Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell. A document can have multiple labels. Updating labels on a document will replace any existing labels for that document.";
                readonly items: {
                    readonly type: "object";
                    readonly description: "Labels can be used to organize documents and templates in a way that can make it easy to find using the document search/template search in SignWell. Labels can be used to organize documents in a way that can make it easy to find using the document search in SignWell.";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["name"];
                };
            };
            readonly checkbox_groups: {
                readonly type: "array";
                readonly description: "Checkbox fields that are placed on a document can be grouped with selection requirements. At least 2 checkbox fields in an array of fields must be assigned to the same recipient.";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly group_name: {
                            readonly type: "string";
                            readonly description: "A unique identifier for the checkbox group.";
                        };
                        readonly placeholder_id: {
                            readonly type: "string";
                            readonly description: "The recipient ID associated with the checkbox group.";
                        };
                        readonly checkbox_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly description: "A unique identifier for each checkbox in a group. ID must match the api_id of the checkbox field.";
                            };
                        };
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: readonly ["minimum", "maximum", "range", "exact"];
                            readonly description: "Set requirements for the group of one or multiple selections by the recipient. Defaults to minimum. Validation values: minimum, maximum, exact, range.";
                        };
                        readonly required: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "Whether the group must be completed by the recipient. Defaults to false.";
                        };
                        readonly min_value: {
                            readonly type: "integer";
                            readonly description: "The minimum number of checkboxes that must be checked in the group. (Only for validation: minimum and range)";
                        };
                        readonly max_value: {
                            readonly type: "integer";
                            readonly description: "The maximum number of checkboxes that can be checked in the group. (Only for validation: maximum and range)";
                        };
                        readonly exact_value: {
                            readonly type: "integer";
                            readonly description: "The exact number of checkboxes that must be checked in the group. (Only for validation: exact)";
                        };
                    };
                    readonly required: readonly ["group_name", "recipient_id", "checkbox_ids"];
                };
            };
        };
        readonly required: readonly ["files", "placeholders"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for a template.";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { DeleteApiV1ApiApplicationsId, DeleteApiV1DocumentTemplatesId, DeleteApiV1DocumentsId, DeleteApiV1HooksId, GetApiV1ApiApplicationsId, GetApiV1BulkSends, GetApiV1BulkSendsCsvTemplate, GetApiV1BulkSendsId, GetApiV1BulkSendsIdDocuments, GetApiV1DocumentTemplatesId, GetApiV1DocumentsId, GetApiV1DocumentsIdCompletedPdf, GetApiV1Hooks, GetApiV1Me, PostApiV1BulkSends, PostApiV1BulkSendsValidateCsv, PostApiV1DocumentTemplates, PostApiV1DocumentTemplatesDocuments, PostApiV1Documents, PostApiV1DocumentsIdRemind, PostApiV1DocumentsIdSend, PostApiV1Hooks, PutApiV1DocumentTemplatesId };
