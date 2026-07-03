"use strict";
/**
 * GitLab Integration Module - Centralized Exports
 *
 * This module provides integration with GitLab API for indexing
 * repository content into the RAG system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLabIndexer = exports.GitLabClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "GitLabClient", { enumerable: true, get: function () { return client_1.GitLabClient; } });
var indexer_1 = require("./indexer");
Object.defineProperty(exports, "GitLabIndexer", { enumerable: true, get: function () { return indexer_1.GitLabIndexer; } });
