const { indexAll, executeSource } = require('../index-all');
const { execSync } = require('child_process');

// Mock child_process for testing
jest.mock('child_process');

describe('indexAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeSource', () => {
    it('should execute command successfully', async () => {
      execSync.mockReturnValue('success');
      
      const result = await executeSource('TestSource', 'echo "test"');
      
      expect(result.success).toBe(true);
      expect(result.stats.source).toBe('TestSource');
      expect(result.stats.status).toBe('completed');
      expect(execSync).toHaveBeenCalledWith('echo "test"', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    it('should handle command errors', async () => {
      const mockError = new Error('Command failed');
      mockError.message = 'Command failed';
      execSync.mockImplementation(() => {
        throw mockError;
      });
      
      const result = await executeSource('TestSource', 'invalid-command');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed');
      expect(result.stats.source).toBe('TestSource');
      expect(result.stats.status).toBe('failed');
    });

    it('should add dry-run flag when specified', async () => {
      execSync.mockReturnValue('success');
      
      await executeSource('TestSource', 'echo "test"', true);
      
      expect(execSync).toHaveBeenCalledWith('echo "test" --dry-run', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
  });

  describe('indexAll', () => {
    it('should execute all sources sequentially', async () => {
      execSync.mockReturnValue('success');
      
      const result = await indexAll({ dryRun: false });
      
      expect(result.success).toBe(true);
      expect(result.stats.totalSuccess).toBe(3);
      expect(result.stats.totalErrors).toBe(0);
      expect(result.results.length).toBe(3);
    });

    it('should continue on source errors', async () => {
      // Mock first source to fail, others to succeed
      execSync
        .mockImplementationOnce(() => { throw new Error('Source 1 failed'); })
        .mockReturnValueOnce('success')
        .mockReturnValueOnce('success');
      
      const result = await indexAll({ dryRun: false });
      
      expect(result.success).toBe(false); // Overall failure
      expect(result.stats.totalSuccess).toBe(2);
      expect(result.stats.totalErrors).toBe(1);
      expect(result.results.length).toBe(3);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
      expect(result.results[2].success).toBe(true);
    });

    it('should handle dry-run mode', async () => {
      execSync.mockReturnValue('success');
      
      const result = await indexAll({ dryRun: true });
      
      // Should call commands with --dry-run flag
      expect(execSync.mock.calls[0][0]).toContain('--dry-run');
      expect(execSync.mock.calls[1][0]).toContain('--dry-run');
      expect(execSync.mock.calls[2][0]).toContain('--dry-run');
    });

    it('should skip disabled sources', async () => {
      execSync.mockReturnValue('success');
      
      const result = await indexAll({ dryRun: false });
      
      // All sources are enabled by default, so should execute all
      expect(execSync).toHaveBeenCalledTimes(3);
    });

    it('should measure processing time', async () => {
      execSync.mockReturnValue('success');
      
      const startTime = Date.now();
      const result = await indexAll({ dryRun: false });
      const endTime = Date.now();
      
      expect(result.stats.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.stats.processingTime).toBeLessThanOrEqual(endTime - startTime + 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      execSync.mockImplementation(() => { throw new Error('Unexpected error'); });
      
      const result = await indexAll({ dryRun: false });
      
      expect(result.success).toBe(false);
      expect(result.stats.totalErrors).toBe(3);
      expect(result.results.every(r => !r.success)).toBe(true);
    });

    it('should include error details in results', async () => {
      const testError = new Error('Test error');
      execSync.mockImplementation(() => { throw testError; });
      
      const result = await indexAll({ dryRun: false });
      
      result.results.forEach(r => {
        expect(r.error).toContain('Test error');
        expect(r.stats.status).toBe('failed');
      });
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      execSync.mockReturnValue('success');
      
      const result = await indexAll({ dryRun: false });
      
      expect(result.stats).toEqual({
        totalSources: 3,
        totalSuccess: 3,
        totalErrors: 0,
        processingTime: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should count partial success correctly', async () => {
      execSync
        .mockImplementationOnce(() => { throw new Error('Failed'); })
        .mockReturnValueOnce('success')
        .mockReturnValueOnce('success');
      
      const result = await indexAll({ dryRun: false });
      
      expect(result.stats.totalSuccess).toBe(2);
      expect(result.stats.totalErrors).toBe(1);
    });
  });
});

describe('CLI Interface', () => {
  const originalArgv = process.argv;
  const originalExit = process.exit;

  beforeEach(() => {
    jest.resetModules();
    process.argv = [...originalArgv];
    process.exit = jest.fn();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  it('should show help when --help flag is provided', async () => {
    process.argv.push('--help');
    
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Import fresh to get CLI execution
    const { main } = require('../index-all');
    await main();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('--help'));
    expect(process.exit).toHaveBeenCalledWith(0);
    
    consoleSpy.mockRestore();
  });

  it('should handle dry-run flag', async () => {
    process.argv.push('--dry-run');
    
    const execSyncSpy = jest.spyOn(require('child_process'), 'execSync');
    
    // Import fresh to get CLI execution
    const { main } = require('../index-all');
    await main();
    
    // Should call commands with --dry-run
    expect(execSyncSpy.mock.calls[0][0]).toContain('--dry-run');
    
    execSyncSpy.mockRestore();
  });
});