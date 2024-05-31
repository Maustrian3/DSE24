import app from '../index.js';
import request from 'supertest';

jest.mock('../../common/db.js', () => ({
    __esModule: true, // this property makes it work
    // default: 'mockedDefaultExportDb',
    getConnection: jest.fn(),
    releaseConnection: jest.fn(),
}));

jest.mock('../query.js', () => ({
    __esModule: true, // this property makes it work
    // default: 'mockedDefaultExportQuery',
    getVehicleKind: jest.fn(),
}));

import { getConnection, releaseConnection } from '../../common/db';
import { getVehicleKind } from '../query.js';

describe('GET /vehicles/:vin/kind', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // it('should respond with 404 for unknown VIN', async () => {
    //     const unknownVIN = 'unknownvin123';
    //
    //     // Simulate no results for unknown VIN
    //     queryModule.getVehicleKind.mockResolvedValue([]);
    //
    //     const response = await request(app).get(`/vehicles/${unknownVIN}/kind`);
    //
    //     expect(response.status).toBe(404);
    //     expect(response.text).toBe(`Unknown VIN '${unknownVIN}'`);
    // });

    it('should respond with kind for known VIN', async () => {
        const knownVIN = 'knownvin123';
        const isLeading = 1; // or false depending on what you want to test

        getConnection.mockResolvedValue({});
        releaseConnection.mockResolvedValue({});

        // Simulate known VIN with is_leading result
        getVehicleKind.mockResolvedValue([{ is_leading: isLeading }]);

        const response = await request(app).get(`/vehicles/${knownVIN}/kind`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ kind: isLeading ? 'leading' : 'following' });
    });
});