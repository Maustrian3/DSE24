import {app, closeServer, createApp} from '../index.js';
import request from 'supertest';

jest.mock('../../common/db.js', () => ({
  __esModule: true,
  getConnection: jest.fn(),
  releaseConnection: jest.fn(),
  initDb: jest.fn(),
}));

jest.mock('../query.js', () => ({
  __esModule: true,
  getVehicleKind: jest.fn(),
  getVehicleChannelId: jest.fn(),
  insertNewVehicle: jest.fn(),
}));

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

// Mocked imports
import {getConnection, initDb, releaseConnection} from '../../common/db';
import {getVehicleKind, getVehicleChannelId, insertNewVehicle} from '../query.js';
import {randomUUID} from 'node:crypto';

describe('Routes tests', () => {

  beforeAll(async () => {
    //initDb.mockResolvedValue({});

    //await createApp();
    // await startServer();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock: Resolve database connection to empty objects
    //initDb.mockResolvedValue({});
    getConnection.mockResolvedValue({});
    releaseConnection.mockResolvedValue({});
  });

  afterAll(async () => {
    jest.clearAllMocks();
    //await closeServer();
  });

  describe('GET /vehicles/:vin/kind', () => {
    it('should respond with 404 for unknown VIN', async () => {
      const unknownVIN = 'unknownvin1235678';

      // Simulate no results for unknown VIN
      getVehicleKind.mockResolvedValue([]);

      const response = await request(app).get(`/vehicles/${unknownVIN}/kind`);

      expect(response.status).toBe(404);
      expect(response.text).toBe(`Unknown VIN '${unknownVIN}'`);
    });

    it('should respond with kind for known VIN', async () => {
      const knownVIN = 'knownvin123';
      const isLeading = 1; // or false depending on what you want to test

      // Simulate known VIN with is_leading result
      getVehicleKind.mockResolvedValue([{is_leading: isLeading}]);

      const response = await request(app).get(`/vehicles/${knownVIN}/kind`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({kind: isLeading ? 'leading' : 'following'});
    });
  });

  describe('GET /vehicles/:vin/channel', () => {
    it('should respond with 404 for unknown VIN', async () => {
      const unknownVIN = 'unknownvin1235678';

      getVehicleChannelId.mockResolvedValue([]);

      const response = await request(app).get(`/vehicles/${unknownVIN}/channel`);

      expect(response.status).toBe(404);
      expect(response.text).toBe(`Unknown VIN '${unknownVIN}'`);
    });

    it('should respond with channel ID for known VIN', async () => {
      const knownVIN = 'knownvin123567891';
      const expectedResults = {channel_id: 1};

      getVehicleChannelId.mockResolvedValue([{channel_id: 1}]);

      const response = await request(app).get(`/vehicles/${knownVIN}/channel`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResults);
    });
  });

  describe('POST /vehicles', () => {

    const validVehicle = {
      vin: 'newvehicle1234567',
      name: 'Test Vehicle',
      oem: 'Test OEM',
      model_type: 'Sedan',
      kind: 'leading',
    };

    it('should create a vehicle successfully', async () => {

      insertNewVehicle.mockResolvedValue({affectedRows: 1});
      // Mock UUID generation
      randomUUID.mockReturnValue('test-uuid');

      const response = await request(app).post('/vehicles').send(validVehicle);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({channel_id: 'test-uuid'});
    });

    it('should respond with 422 for invalid vehicle object', async () => {
      const invalidVehicle = {
        vin: 'newvin12356789101', // Missing other required fields
      };

      insertNewVehicle.mockResolvedValue([]);

      const response = await request(app).post('/vehicles').send(invalidVehicle);

      expect(response.status).toBe(422);
      expect(response.text).toContain('Invalid vehicle object');
    });

    it('should respond with 422 for duplicate VIN', async () => {

      insertNewVehicle.mockRejectedValue({code: 'ER_DUP_ENTRY'});

      const response = await request(app).post('/vehicles').send(validVehicle);

      expect(response.status).toBe(422);
      expect(response.text).toBe('Could not create vehicle: Duplicate VIN');
    });

    it('should respond with 500 for other database errors', async () => {
      insertNewVehicle.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/vehicles').send(validVehicle);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Could not create vehicle');
    });
  });
});