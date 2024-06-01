
export async function runUntilTimeout( simulator ) {

}

// Test that following vehicle suddenly no longer obeys the command of the leading vehicle
export async function followingVehicleDisobeys( simulator ) {
  this.followingVehicle.manualMode = true;
  this.leadingVehicle.speed = this.leadingVehicle.speed += 20;
}

// Test following vehicle suddenly stops followMe itself
export async function followingVehicleStopsFollowMe( simulator ) {
  this.followingVehicle.stopFollowMe();
  this.followingVehicle.manualMode = true;
}

// Test leading vehicle suddenly stops followMe itself
export async function leadingVehicleStopsFollowMe( simulator ) {
  this.leadingVehicle.stopFollowMe();
  this.leadingVehicle.manualMode = true;  
}

// Test vehicle no longer sends location updates to backend
export async function followingVehicleNoLocationUpdates( simulator ) {
  this.followingVehicle.stopUpdaterTimer();
}
