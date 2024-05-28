import assert from 'assert';
import {getVehicleChannelId, getVehicleKind, insertNewVehicle} from '../query.js';
import {getConnection, initDb, releaseConnection} from '../../common/db.js';
import dotenv from "dotenv";


// TODO:
// Create database connection before each test
// Close database connection after each test
// Create dummy data and insert it into database
// Test all functions in query.js


describe('database queries', function (){

  let conn = null;

  beforeEach(async function () {
    dotenv.config();
    await initDb();
    conn = await getConnection();
  });

  afterEach(async function () {
    releaseConnection(conn);
  });

  async function insertTestData() {
    // Vehicle Lead
    let vin = 'aaaaaaaaaaaaaaaa0';
    let name = 'Dummy Vehicle A';
    let oem = 'Audi';
    let model_type = 'SQ8 e-tron';
    let isLeading = true;
    let channelId = 1;

    let insertResults = await insertNewVehicle(conn, vin, name, oem, model_type, isLeading, channelId);
    if (insertResults.affectedRows < 1) {
      throw Error('Insertion error');
    }
  }

  async function getVehicleByVIN(vin) {
    return await conn.execute(
      'SELECT vin, name, oem, model_type, is_leading, channel_id FROM inventory_vehicles WHERE vin = ?',
      [vin]
    );
  }

  describe('insertNewVehicle', function () {
    const vin = Math.floor(Math.random() * 10e12).toString().padStart(17, 'a');
    const name = 'Dummy Vehicle A';
    const oem = 'Audi';
    const model_type = 'SQ8 e-tron';
    const isLeading = true;
    const channelId = 1;

    it('should insert a new vehicle into the database', async function () {

      // Call the function with sample data
      const insertResults = await insertNewVehicle(conn, vin, name, oem, model_type, isLeading, channelId);

      // Add assertions to check if the insert was successful
      assert(insertResults.affectedRows > 0, 'No rows were affected by the insert operation');

      // Assert if the vehicle is in the database
      const [rows] = await getVehicleByVIN(vin);
      const vehicle = rows[0]; // Fetch the first row from the result set
      assert.equal(vehicle.vin, vin);
      assert.equal(vehicle.name, name);
      assert.equal(vehicle.oem, oem);
      assert.equal(vehicle.model_type, model_type);
      assert.equal(vehicle.is_leading, isLeading);
      assert.equal(vehicle.channel_id, channelId);
    });
  });

  describe('getVehicleChannelId', async function () {
    before(async function () {
      await insertTestData();
    });

    it('should return the channel ID of a vehicle given its VIN', async function () {
      const vin = 'aaaaaaaaaaaaaaaa0';
      const results = await getVehicleChannelId(conn, vin);
      assert(results.length > 0, 'No vehicle with given VIN found');
      assert.deepStrictEqual(results[0], {channel_id: 1});
    });
  });

  describe('getVehicleKind', async function () {
    before(async function () {
      await insertTestData();
    });

    it('should return the kind of the vehicle of the given VIN', async function () {
      const vin = 'aaaaaaaaaaaaaaaa0';
      const results = await getVehicleKind(conn, vin);
      assert(results.length > 0, 'No vehicle with given VIN found');
      assert.deepStrictEqual(results[0], {is_leading: 1});
    });
  });
});
