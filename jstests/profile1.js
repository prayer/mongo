
try {

    /* With pre-created system.profile (capped) */
    db.runCommand({profile: 0});
    db.getCollection("system.profile").drop();
    assert(!db.getLastError(), "Z");
    assert.eq(0, db.runCommand({profile: -1}).was, "A");
    
    db.createCollection("system.profile", {capped: true, size: 10000});
    db.runCommand({profile: 2});
    assert.eq(2, db.runCommand({profile: -1}).was, "B");
    assert.eq(1, db.system.profile.stats().capped, "C");
    var capped_size = db.system.profile.storageSize();
    assert.gt(capped_size, 9999, "D");
    assert.lt(capped_size, 20000, "E");
    
    db.foo.findOne()
    
    assert.eq( 4 , db.system.profile.find().count() , "E2" );
    
    /* Make sure we can't drop if profiling is still on */
    assert.throws( function(z){ db.getCollection("system.profile").drop(); } )

    /* With pre-created system.profile (un-capped) */
    db.runCommand({profile: 0});
    db.getCollection("system.profile").drop();
    assert.eq(0, db.runCommand({profile: -1}).was, "F");
    
    db.createCollection("system.profile");
    db.runCommand({profile: 2});
    assert.eq(2, db.runCommand({profile: -1}).was, "G");
    assert.eq(null, db.system.profile.stats().capped, "G1");
    
    /* With no system.profile collection */
    db.runCommand({profile: 0});
    db.getCollection("system.profile").drop();
    assert.eq(0, db.runCommand({profile: -1}).was, "H");
    
    db.runCommand({profile: 2});
    assert.eq(2, db.runCommand({profile: -1}).was, "I");
    assert.eq(1, db.system.profile.stats().capped, "J");
    var auto_size = db.system.profile.storageSize();
    assert.gt(auto_size, capped_size, "K");
    

    db.eval("sleep(1)") // pre-load system.js

    db.setProfilingLevel(2);
    before = db.system.profile.count();
    db.eval( "sleep(25)" )
    db.eval( "sleep(120)" )
    after = db.system.profile.count()
    assert.eq( before + 3 , after , "X1" )

    db.setProfilingLevel(1,100);
    before = db.system.profile.count();
    db.eval( "sleep(25)" )
    db.eval( "sleep(120)" )
    after = db.system.profile.count()
    assert.eq( before + 1 , after , "X2" )

    db.setProfilingLevel(1,20);
    before = db.system.profile.count();
    db.eval( "sleep(25)" )
    db.eval( "sleep(120)" )
    after = db.system.profile.count()
    assert.eq( before + 2 , after , "X3" )
    
    
    db.profile.drop();
    db.setProfilingLevel(2)
    var q = { _id : 5 };
    var u = { $inc : { x : 1 } };
    db.profile1.update( q , u );
    var r = db.system.profile.find().sort( { $natural : -1 } )[0]
    assert.eq( q , r.query , "Y1" );
    assert.eq( u , r.updateobj , "Y2" );
    assert.eq( "update" , r.op , "Y3" );
    assert.eq( "test.profile1" , r.ns , "Y4" );
    

} finally {
    // disable profiling for subsequent tests
    assert.commandWorked( db.runCommand( {profile:0} ) );
}
