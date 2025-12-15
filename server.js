import Fastify from 'fastify';
import cors from '@fastify/cors';
import { recolorV1, recolorV2 } from './recolor.js';

const fastify = Fastify({
    logger: {
        level: 'info'
    }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', version: '1.0.0' };
});

// V1 Recolor endpoint (RGB distance)
fastify.post('/api/recolor/v1', async (request, reply) => {
    try {
        const { svg, palette } = request.body;

        // Validate input
        if (!svg || typeof svg !== 'string') {
            return reply.code(400).send({
                error: 'Invalid request',
                message: 'SVG string is required'
            });
        }

        if (!palette || !Array.isArray(palette) || palette.length === 0) {
            return reply.code(400).send({
                error: 'Invalid request',
                message: 'Palette array is required and must not be empty'
            });
        }

        // Validate palette colors
        const hexPattern = /^#[0-9a-f]{6}$/i;
        const invalidColors = palette.filter(color => !hexPattern.test(color));
        if (invalidColors.length > 0) {
            return reply.code(400).send({
                error: 'Invalid palette',
                message: `Invalid hex colors: ${invalidColors.join(', ')}`
            });
        }

        // Perform recoloring
        const result = recolorV1(svg, palette);

        // Return raw SVG
        return reply
            .header('Content-Type', 'image/svg+xml')
            .header('X-Color-Mapping', JSON.stringify(result.mapping))
            .header('X-Detected-Colors', JSON.stringify(result.detectedColors))
            .send(result.svg);

    } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
            error: 'Recoloring failed',
            message: error.message
        });
    }
});

// V2 Recolor endpoint (LAB color space)
fastify.post('/api/recolor/v2', async (request, reply) => {
    try {
        const { svg, palette } = request.body;

        // Validate input
        if (!svg || typeof svg !== 'string') {
            return reply.code(400).send({
                error: 'Invalid request',
                message: 'SVG string is required'
            });
        }

        if (!palette || !Array.isArray(palette) || palette.length === 0) {
            return reply.code(400).send({
                error: 'Invalid request',
                message: 'Palette array is required and must not be empty'
            });
        }

        // Validate palette colors
        const hexPattern = /^#[0-9a-f]{6}$/i;
        const invalidColors = palette.filter(color => !hexPattern.test(color));
        if (invalidColors.length > 0) {
            return reply.code(400).send({
                error: 'Invalid palette',
                message: `Invalid hex colors: ${invalidColors.join(', ')}`
            });
        }

        // Perform recoloring
        const result = recolorV2(svg, palette);

        // Return raw SVG
        return reply
            .header('Content-Type', 'image/svg+xml')
            .header('X-Color-Mapping', JSON.stringify(result.mapping))
            .header('X-Detected-Colors', JSON.stringify(result.detectedColors))
            .header('X-Color-Distances', JSON.stringify(result.distances))
            .send(result.svg);

    } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
            error: 'Recoloring failed',
            message: error.message
        });
    }
});

// Start server
const start = async () => {
    try {
        // Register CORS plugin
        await fastify.register(cors, {
            origin: true
        });

        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';

        await fastify.listen({ port, host });

        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   Recolor SVG API Server                          ║
║                                                   ║
║   Server running at: http://localhost:${port}      ║
║                                                   ║
║   Endpoints:                                      ║
║   • POST /api/recolor/v1 - RGB distance           ║
║   • POST /api/recolor/v2 - LAB color space        ║
║   • GET  /health         - Health check           ║
║                                                   ║
║   Example request:                                ║
║   curl -X POST http://localhost:${port}/api/recolor/v1 \\
║        -H "Content-Type: application/json" \\      ║
║        -d '{"svg":"<svg>...</svg>",               ║
║             "palette":["#fff","#000"]}'           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
