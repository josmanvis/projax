"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORKS = void 0;
exports.detectTestFramework = detectTestFramework;
exports.isTestFile = isTestFile;
exports.detectProjectFramework = detectProjectFramework;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.FRAMEWORKS = [
    {
        name: 'jest',
        configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json', 'jest.config.mjs', 'jest.config.cjs'],
        testPatterns: [
            /\.test\.(js|ts|jsx|tsx)$/i,
            /\.spec\.(js|ts|jsx|tsx)$/i,
        ],
        testDirs: ['__tests__', '__test__'],
    },
    {
        name: 'vitest',
        configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
        testPatterns: [
            /\.test\.(js|ts|jsx|tsx)$/i,
            /\.spec\.(js|ts|jsx|tsx)$/i,
        ],
        testDirs: ['__tests__'],
    },
    {
        name: 'mocha',
        configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml', '.mocharc.yml', 'mocha.opts'],
        testPatterns: [
            /\.test\.(js|ts|jsx|tsx)$/i,
            /\.spec\.(js|ts|jsx|tsx)$/i,
        ],
        testDirs: ['test', 'tests'],
    },
];
function detectTestFramework(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    // Check package.json for test scripts and dependencies
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            // Check dependencies and devDependencies
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps.jest)
                return 'jest';
            if (deps.vitest)
                return 'vitest';
            if (deps.mocha)
                return 'mocha';
            // Check for jest config in package.json
            if (packageJson.jest)
                return 'jest';
            // Check test scripts
            if (packageJson.scripts) {
                const testScript = packageJson.scripts.test || '';
                if (testScript.includes('jest'))
                    return 'jest';
                if (testScript.includes('vitest'))
                    return 'vitest';
                if (testScript.includes('mocha'))
                    return 'mocha';
            }
        }
        catch (error) {
            // Invalid JSON, continue with file-based detection
        }
    }
    // Check for config files
    for (const framework of exports.FRAMEWORKS) {
        for (const configFile of framework.configFiles) {
            const configPath = path.join(projectPath, configFile);
            if (fs.existsSync(configPath)) {
                return framework.name;
            }
        }
    }
    return null;
}
function isTestFile(filePath, detectedFramework = null) {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    const parentDirName = path.basename(dirName);
    // If framework is detected, use its specific patterns
    if (detectedFramework) {
        const framework = exports.FRAMEWORKS.find(f => f.name === detectedFramework);
        if (framework) {
            // Check test patterns
            for (const pattern of framework.testPatterns) {
                if (pattern.test(fileName)) {
                    return true;
                }
            }
            // Check test directories
            for (const testDir of framework.testDirs) {
                if (parentDirName === testDir) {
                    return true;
                }
            }
        }
    }
    // Fallback: check all common patterns
    for (const framework of exports.FRAMEWORKS) {
        for (const pattern of framework.testPatterns) {
            if (pattern.test(fileName)) {
                return true;
            }
        }
        for (const testDir of framework.testDirs) {
            if (parentDirName === testDir) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Detect the main framework/library used in a project
 * Returns null if no framework is detected
 */
function detectProjectFramework(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        // Check for non-JS projects
        if (fs.existsSync(path.join(projectPath, 'Cargo.toml')))
            return 'rust';
        if (fs.existsSync(path.join(projectPath, 'go.mod')))
            return 'go';
        if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
            fs.existsSync(path.join(projectPath, 'setup.py')) ||
            fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
            return 'python';
        }
        return null;
    }
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        // Meta-frameworks (check these first as they often include the base frameworks)
        if (deps['next'] || deps['next.js'])
            return 'next.js';
        if (deps['@nuxt/kit'] || deps['nuxt'] || deps['nuxt3'])
            return 'nuxt.js';
        if (deps['gatsby'])
            return 'gatsby';
        if (deps['@remix-run/react'] || deps['remix'])
            return 'remix';
        if (deps['@astro'] || deps['astro'])
            return 'astro';
        if (deps['@angular/core'])
            return 'angular';
        if (deps['expo'] || deps['expo-cli'])
            return 'expo';
        // React Native (check before React)
        if (deps['react-native'])
            return 'react-native';
        // Frontend frameworks
        if (deps['react'] || deps['react-dom'])
            return 'react';
        if (deps['vue']) {
            // Check Vue version
            const vueVersion = deps['vue']?.match(/\d+/)?.[0];
            return vueVersion === '3' ? 'vue 3' : 'vue';
        }
        if (deps['svelte'])
            return 'svelte';
        if (deps['solid-js'])
            return 'solid';
        if (deps['preact'])
            return 'preact';
        if (deps['alpine'] || deps['alpinejs'])
            return 'alpine.js';
        if (deps['lit'] || deps['lit-element'])
            return 'lit';
        if (deps['hyperapp'])
            return 'hyperapp';
        if (deps['mithril'])
            return 'mithril';
        if (deps['inferno'])
            return 'inferno';
        if (deps['marko'])
            return 'marko';
        // Backend frameworks
        if (deps['express'])
            return 'express';
        if (deps['@nestjs/core'])
            return 'nest.js';
        if (deps['fastify'])
            return 'fastify';
        if (deps['koa'])
            return 'koa';
        if (deps['hapi'] || deps['@hapi/hapi'])
            return 'hapi';
        if (deps['@apollo/server'] || deps['apollo-server'])
            return 'apollo';
        if (deps['graphql'] && (deps['@graphql-yoga/node'] || deps['graphql-yoga']))
            return 'graphql-yoga';
        if (deps['@trpc/server'])
            return 'trpc';
        if (deps['@redwoodjs/core'])
            return 'redwood.js';
        if (deps['@blitzjs/core'])
            return 'blitz.js';
        // Electron
        if (deps['electron'])
            return 'electron';
        // Static site generators
        if (deps['@11ty/eleventy'])
            return '11ty';
        if (deps['hexo'])
            return 'hexo';
        if (deps['jekyll'])
            return 'jekyll';
        if (deps['hugo'])
            return 'hugo';
        // Mobile development
        if (deps['@ionic/core'] || deps['@ionic/angular'] || deps['@ionic/react'])
            return 'ionic';
        if (deps['@nativescript/core'])
            return 'nativescript';
        if (deps['@capacitor/core'])
            return 'capacitor';
        if (deps['cordova'])
            return 'cordova';
        // Desktop development
        if (deps['tauri'])
            return 'tauri';
        if (deps['nw.js'] || deps['nw'])
            return 'nw.js';
        // Build tools / bundlers (as last resort)
        if (deps['vite'])
            return 'vite';
        if (deps['webpack'])
            return 'webpack';
        if (deps['parcel'])
            return 'parcel';
        if (deps['rollup'])
            return 'rollup';
        if (deps['esbuild'])
            return 'esbuild';
        if (deps['turbopack'])
            return 'turbopack';
        // Generic Node.js if no specific framework found but package.json exists
        return 'node.js';
    }
    catch (error) {
        // Invalid JSON or read error
        return null;
    }
}
