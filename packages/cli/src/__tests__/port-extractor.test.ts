import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { extractPortsFromProject, PortInfo } from '../port-extractor';

describe('port-extractor', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `projax-port-extractor-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('extractPortsFromProject', () => {
    it('should return empty array for empty directory', async () => {
      const ports = await extractPortsFromProject(testDir);
      expect(ports).toEqual([]);
    });

    describe('package.json extraction', () => {
      it('should extract port from --port flag in scripts', async () => {
        const packageJson = {
          scripts: {
            dev: 'vite --port 3000',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3000,
          script: 'dev',
          source: 'package.json',
        });
      });

      it('should extract port from -p flag in scripts', async () => {
        const packageJson = {
          scripts: {
            start: 'next dev -p 4000',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 4000,
          script: 'start',
          source: 'package.json',
        });
      });

      it('should extract port from PORT= in scripts', async () => {
        const packageJson = {
          scripts: {
            serve: 'PORT=5000 node server.js',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 5000,
          script: 'serve',
          source: 'package.json',
        });
      });

      it('should extract port from VITE_PORT= in scripts', async () => {
        const packageJson = {
          scripts: {
            dev: 'VITE_PORT=3001 vite',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3001,
          script: 'dev',
          source: 'package.json',
        });
      });

      it('should extract multiple ports from different scripts', async () => {
        const packageJson = {
          scripts: {
            dev: 'vite --port 3000',
            preview: 'vite preview --port 4000',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports.length).toBe(2);
        expect(ports.find(p => p.port === 3000)).toBeDefined();
        expect(ports.find(p => p.port === 4000)).toBeDefined();
      });

      it('should handle malformed package.json gracefully', async () => {
        fs.writeFileSync(path.join(testDir, 'package.json'), 'not valid json');

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toEqual([]);
      });

      it('should handle package.json without scripts', async () => {
        const packageJson = { name: 'test' };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toEqual([]);
      });

      it('should ignore invalid port numbers', async () => {
        const packageJson = {
          scripts: {
            dev: 'node server.js --port 99999', // Invalid port
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toEqual([]);
      });
    });

    describe('vite.config extraction', () => {
      it('should extract port from vite.config.js', async () => {
        const viteConfig = `
export default {
  server: {
    port: 5173
  }
}
        `;
        fs.writeFileSync(path.join(testDir, 'vite.config.js'), viteConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 5173,
          script: null,
          source: 'vite.config.js',
        });
      });

      it('should extract port from vite.config.ts', async () => {
        const viteConfig = `
import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    port: 3000
  }
});
        `;
        fs.writeFileSync(path.join(testDir, 'vite.config.ts'), viteConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3000,
          script: null,
          source: 'vite.config.ts',
        });
      });

      it('should extract port from vite.config.mjs', async () => {
        const viteConfig = `
export default {
  server: { port: 8080 }
}
        `;
        fs.writeFileSync(path.join(testDir, 'vite.config.mjs'), viteConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 8080,
          script: null,
          source: 'vite.config.mjs',
        });
      });
    });

    describe('webpack.config extraction', () => {
      it('should extract port from webpack.config.js devServer', async () => {
        const webpackConfig = `
module.exports = {
  devServer: {
    port: 8081
  }
};
        `;
        fs.writeFileSync(path.join(testDir, 'webpack.config.js'), webpackConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 8081,
          script: null,
          source: 'webpack.config.js',
        });
      });
    });

    describe('angular.json extraction', () => {
      it('should extract port from angular.json', async () => {
        const angularJson = {
          projects: {
            myApp: {
              architect: {
                serve: {
                  options: {
                    port: 4200,
                  },
                },
              },
            },
          },
        };
        fs.writeFileSync(path.join(testDir, 'angular.json'), JSON.stringify(angularJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 4200,
          script: null,
          source: 'angular.json',
        });
      });

      it('should handle malformed angular.json gracefully', async () => {
        fs.writeFileSync(path.join(testDir, 'angular.json'), 'not valid json');

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toEqual([]);
      });
    });

    describe('nuxt.config extraction', () => {
      it('should extract port from nuxt.config.js', async () => {
        const nuxtConfig = `
export default {
  server: {
    port: 3001
  }
}
        `;
        fs.writeFileSync(path.join(testDir, 'nuxt.config.js'), nuxtConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3001,
          script: null,
          source: 'nuxt.config.js',
        });
      });

      it('should extract port from nuxt.config.ts', async () => {
        const nuxtConfig = `
export default defineNuxtConfig({
  server: {
    port: 3002
  }
});
        `;
        fs.writeFileSync(path.join(testDir, 'nuxt.config.ts'), nuxtConfig);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3002,
          script: null,
          source: 'nuxt.config.ts',
        });
      });
    });

    describe('.env file extraction', () => {
      it('should extract PORT from .env file', async () => {
        const envContent = `
NODE_ENV=development
PORT=3000
        `;
        fs.writeFileSync(path.join(testDir, '.env'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3000,
          script: null,
          source: '.env',
        });
      });

      it('should extract VITE_PORT from .env file', async () => {
        const envContent = 'VITE_PORT=5174';
        fs.writeFileSync(path.join(testDir, '.env'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 5174,
          script: null,
          source: '.env',
        });
      });

      it('should extract from .env.local', async () => {
        const envContent = 'PORT=4000';
        fs.writeFileSync(path.join(testDir, '.env.local'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 4000,
          script: null,
          source: '.env.local',
        });
      });

      it('should extract from .env.development', async () => {
        const envContent = 'PORT=4001';
        fs.writeFileSync(path.join(testDir, '.env.development'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 4001,
          script: null,
          source: '.env.development',
        });
      });

      it('should extract REACT_APP_PORT from .env', async () => {
        const envContent = 'REACT_APP_PORT=3002';
        fs.writeFileSync(path.join(testDir, '.env'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 3002,
          script: null,
          source: '.env',
        });
      });

      it('should skip comments in .env files', async () => {
        const envContent = `
# This is a comment
# PORT=9999
PORT=3000
        `;
        fs.writeFileSync(path.join(testDir, '.env'), envContent);

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toHaveLength(1);
        expect(ports[0].port).toBe(3000);
      });
    });

    describe('next.config extraction', () => {
      it('should extract port from next.config.js if present', async () => {
        const nextConfig = `
module.exports = {
  devServer: {
    port: 3003
  }
};
        `;
        fs.writeFileSync(path.join(testDir, 'next.config.js'), nextConfig);

        const ports = await extractPortsFromProject(testDir);
        // Next.js doesn't typically configure port in config, but if devServer is there
        expect(ports.find(p => p.source === 'next.config.js')).toBeDefined();
      });
    });

    describe('deduplication', () => {
      it('should remove duplicate ports with same port and script', async () => {
        // Create multiple sources with the same port
        const packageJson = {
          scripts: {
            dev: 'vite --port 3000',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const envContent = 'PORT=3000';
        fs.writeFileSync(path.join(testDir, '.env'), envContent);

        const ports = await extractPortsFromProject(testDir);
        // Should have both since they have different scripts (one has 'dev', one has null)
        const port3000 = ports.filter(p => p.port === 3000);
        expect(port3000.length).toBe(2);
      });
    });

    describe('edge cases', () => {
      it('should handle non-existent directory gracefully', async () => {
        const ports = await extractPortsFromProject('/non/existent/path');
        expect(ports).toEqual([]);
      });

      it('should handle port 0', async () => {
        const packageJson = {
          scripts: {
            dev: 'node server.js --port 0',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toEqual([]);
      });

      it('should handle maximum valid port', async () => {
        const packageJson = {
          scripts: {
            dev: 'node server.js --port 65535',
          },
        };
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

        const ports = await extractPortsFromProject(testDir);
        expect(ports).toContainEqual({
          port: 65535,
          script: 'dev',
          source: 'package.json',
        });
      });
    });
  });
});
