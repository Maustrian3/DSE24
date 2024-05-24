
async function reserveVehicle(memcached, key, lifeTime ) {
  let vehicleAvailable= false;

  await memcached.optimisticLock( key, lifeTime, entry => {
    if( entry !== null ) {
      return PromiseMemcached.StopLockAttemptsFlag;
    }
    
    vehicleAvailable= true;
    return {};
  });

  return vehicleAvailable;
}

export async function reserveLeadingVehicle( memcached, leadingVIN, lifeTime ) {
  return reserveVehicle( memcached, `leading-${leadingVIN}`, lifeTime );
}

export async function reserveFollowingVehicle( memcached, followingVIN, lifeTime ) {
  return reserveVehicle( memcached, `following-${followingVIN}`, lifeTime );
}
