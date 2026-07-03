"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLabClient = void 0;
const logger_1 = require("@/lib/logger");
/**
 * GitLabClient - Client for interacting with GitLab API
 *
 * This client provides methods to:
 * - List projects accessible to the authenticated user
 * - List files in a specific project
 * - Download file content from GitLab
 * - Get project information
 *
 * Uses GitLab REST API v4
 */
class GitLabClient {
    /**
     * Create a new GitLabClient instance
     * @param config GitLab configuration including API URL and access token
     */
    constructor(config) {
        this.config = config;
        this.baseUrl = config.apiUrl || 'https://gitlab.com/api/v4';
        this.headers = {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': config.accessToken,
            'User-Agent': 'NexiaMind-GitLab-Client/1.0'
        };
        logger_1.logger.info('GitLabClient initialized', {
            baseUrl: this.baseUrl,
            hasAccessToken: !!config.accessToken
        });
    }
    /**
     * List all projects accessible to the authenticated user
     * @returns Promise<GitLabProject[]> Array of GitLab projects
     */
    async listProjects() {
        try {
            const url = `${this.baseUrl}/projects?membership=true&per_page=100`;
            logger_1.logger.info('Listing GitLab projects', { url });
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.logger.error('Failed to list GitLab projects', {
                    status: response.status,
                    error: errorText,
                    url
                });
                throw new Error(`Failed to list projects: ${response.status} - ${errorText}`);
            }
            const projects = await response.json();
            logger_1.logger.info('GitLab projects retrieved', { count: projects.length });
            return projects;
        }
        catch (error) {
            logger_1.logger.error('Error listing GitLab projects', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    /**
     * List files in a specific GitLab project
     * @param projectId GitLab project ID
     * @param path Path within the project (default: '/')
     * @param ref Branch, tag, or commit SHA (default: 'main')
     * @param recursive Whether to list files recursively
     * @returns Promise<GitLabFileInfo[]> Array of file information
     */
    async listProjectFiles(projectId, path = '/', ref = 'main', recursive = true) {
        try {
            const url = `${this.baseUrl}/projects/${projectId}/repository/tree`;
            const params = new URLSearchParams({
                path: path,
                ref: ref,
                recursive: recursive.toString(),
                per_page: '100'
            });
            const fullUrl = `${url}?${params.toString()}`;
            logger_1.logger.info('Listing GitLab project files', {
                projectId,
                path,
                ref,
                recursive,
                url: fullUrl
            });
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: this.headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.logger.error('Failed to list GitLab project files', {
                    status: response.status,
                    error: errorText,
                    projectId,
                    path
                });
                throw new Error(`Failed to list project files: ${response.status} - ${errorText}`);
            }
            const files = await response.json();
            logger_1.logger.info('GitLab project files retrieved', {
                projectId,
                count: files.length,
                path
            });
            return files;
        }
        catch (error) {
            logger_1.logger.error('Error listing GitLab project files', {
                error: error instanceof Error ? error.message : String(error),
                projectId,
                path
            });
            throw error;
        }
    }
    /**
     * Download file content from GitLab
     * @param projectId GitLab project ID
     * @param filePath Path to the file within the project
     * @param ref Branch, tag, or commit SHA (default: 'main')
     * @returns Promise<Buffer> File content as Buffer
     */
    async downloadFile(projectId, filePath, ref = 'main') {
        try {
            // First, get file information to determine if it's a binary file
            const fileInfoUrl = `${this.baseUrl}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
            const fileInfoParams = new URLSearchParams({
                ref: ref
            });
            const fileInfoResponse = await fetch(`${fileInfoUrl}?${fileInfoParams.toString()}`, {
                method: 'GET',
                headers: this.headers
            });
            if (!fileInfoResponse.ok) {
                const errorText = await fileInfoResponse.text();
                logger_1.logger.error('Failed to get GitLab file info', {
                    status: fileInfoResponse.status,
                    error: errorText,
                    projectId,
                    filePath
                });
                throw new Error(`Failed to get file info: ${fileInfoResponse.status} - ${errorText}`);
            }
            const fileInfo = await fileInfoResponse.json();
            const isBinary = fileInfo.encoding === 'base64';
            // Download the actual file content
            const contentUrl = `${this.baseUrl}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw`;
            const contentParams = new URLSearchParams({
                ref: ref
            });
            const contentResponse = await fetch(`${contentUrl}?${contentParams.toString()}`, {
                method: 'GET',
                headers: this.headers
            });
            if (!contentResponse.ok) {
                const errorText = await contentResponse.text();
                logger_1.logger.error('Failed to download GitLab file', {
                    status: contentResponse.status,
                    error: errorText,
                    projectId,
                    filePath
                });
                throw new Error(`Failed to download file: ${contentResponse.status} - ${errorText}`);
            }
            const content = await contentResponse.arrayBuffer();
            const buffer = Buffer.from(content);
            logger_1.logger.info('GitLab file downloaded successfully', {
                projectId,
                filePath,
                size: buffer.length,
                isBinary
            });
            return buffer;
        }
        catch (error) {
            logger_1.logger.error('Error downloading GitLab file', {
                error: error instanceof Error ? error.message : String(error),
                projectId,
                filePath
            });
            throw error;
        }
    }
    /**
     * Get information about a specific GitLab project
     * @param projectId GitLab project ID
     * @returns Promise<GitLabProject> Project information
     */
    async getProjectInfo(projectId) {
        try {
            const url = `${this.baseUrl}/projects/${projectId}`;
            logger_1.logger.info('Getting GitLab project info', { projectId, url });
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.logger.error('Failed to get GitLab project info', {
                    status: response.status,
                    error: errorText,
                    projectId
                });
                throw new Error(`Failed to get project info: ${response.status} - ${errorText}`);
            }
            const project = await response.json();
            logger_1.logger.info('GitLab project info retrieved', {
                projectId,
                projectName: project.name,
                projectPath: project.path_with_namespace
            });
            return project;
        }
        catch (error) {
            logger_1.logger.error('Error getting GitLab project info', {
                error: error instanceof Error ? error.message : String(error),
                projectId
            });
            throw error;
        }
    }
    /**
     * Check if a file exists in a GitLab project
     * @param projectId GitLab project ID
     * @param filePath Path to the file within the project
     * @param ref Branch, tag, or commit SHA (default: 'main')
     * @returns Promise<boolean> True if file exists, false otherwise
     */
    async fileExists(projectId, filePath, ref = 'main') {
        try {
            const url = `${this.baseUrl}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
            const params = new URLSearchParams({
                ref: ref
            });
            const response = await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
                headers: this.headers
            });
            // File exists if we get a 200 OK response
            const exists = response.ok;
            logger_1.logger.info('GitLab file existence check', {
                projectId,
                filePath,
                exists
            });
            return exists;
        }
        catch (error) {
            logger_1.logger.error('Error checking GitLab file existence', {
                error: error instanceof Error ? error.message : String(error),
                projectId,
                filePath
            });
            return false;
        }
    }
    /**
     * Get the current GitLab client configuration
     * @returns GitLabConfig Current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Update the GitLab client configuration
     * @param config New configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.baseUrl = config.apiUrl || this.baseUrl;
        if (config.accessToken) {
            this.headers['PRIVATE-TOKEN'] = config.accessToken;
        }
        logger_1.logger.info('GitLab client configuration updated', {
            hasNewApiUrl: !!config.apiUrl,
            hasNewAccessToken: !!config.accessToken
        });
    }
}
exports.GitLabClient = GitLabClient;
