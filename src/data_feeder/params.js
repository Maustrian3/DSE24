import dotenv from 'dotenv';
import minimist from 'minimist';
import * as Scenarios from "./scenarios.js";

function orderedScenarios() {
  return Object.keys(Scenarios).sort().map( name => Scenarios[name] );
}

export function parseParams() {
  // Load additional config file
  const options= minimist( process.argv.slice(2) );
  if( options.list ) {
    console.log('Available scenarios:')
    orderedScenarios().forEach(
      (scenario, idx) => console.log(`[${idx}] ${scenario.name}`)
    );
    process.exit(0);
  }

  if( options.config ) {
    if( typeof options.config !== 'string' ) {
      throw new Error('Expected path for --config option');
    }

    dotenv.config({path: options.config, override: true});
  }

  // Use the test scenario from the task description as default
  let scenario= Scenarios.followingVehicleDisobeys;
  if( typeof options.scenario !== 'undefined' ) {
    if( typeof options.scenario !== 'number' || !Number.isInteger(options.scenario) ) {
      throw new Error('Expected index value for --scenario option');
    }

    const scenarios= orderedScenarios();
    if( options.scenario < 0 || options.scenario > scenarios.length-1 ) {
      throw new Error('Scenario index out of range');
    }

    scenario= scenarios[ options.scenario ];
    console.log(`Selected scenario: ${scenario.name}`)
  }

  return { scenario };
}
