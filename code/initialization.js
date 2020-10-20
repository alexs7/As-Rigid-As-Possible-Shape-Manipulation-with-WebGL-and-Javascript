var camera, scene, renderer, mesh;
var origin = new THREE.Vector3(0, 0, 0);
var cameraPosition = new THREE.Vector3(0, 0, 4);
var model = null;
var handles = [];
var edges = [];
var frames = [];
var noFrame = 1;
var keyFrameMode = false;
var selectedHandle = null;
var originalVertices = null;
var deformedVertices = null;
var barycentricCoordMode = false;

function initialization(objFile){
  $("body").css("overflow", "hidden");
  
  drawingSurface = document.getElementById( "drawingSurface" );
  
  if(localStorage.getItem("barycentricCoord") == 'true'){
    barycentricCoordMode = true;
    $('.barycentricCoord').text('Disable Barycentric Coordinates');
  }else{
    barycentricCoordMode = false;
    $('.barycentricCoord').text('Enable Barycentric Coordinates');
  }
  
  if(drawingSurface == null){
    throw new Error('No drawing surface found!');
  }else{
    var clickedOnHandle = false;
    $( "#drawingSurface" ).mousedown(function(event) {
      
      if(keyFrameMode){
        $('.infoText').text('Viewing Keyframe. Please click "Reset" to start again.');
        return false;
      }
      
      var leftClicked = event.which == 1 ? true : false;
      if(leftClicked){
        var x = event.clientX;
        var y = event.clientY;
        
        if(barycentricCoordMode){
          var worldPos = getPointInWorldCoordinates(x,y);
          var nearestHandle = null;
          var nearestHandleIndex = getNearestHandleIndex(x,y,deformedVertices);
          var newHandle = null;
          
          if(handleExistsBaryCentricMode(nearestHandleIndex)){
            selectedHandle = getHandleBaryCentricMode(nearestHandleIndex);
            clickedOnHandle = true;
          }else{
            clickedOnHandle = false;
            newHandle = createHandleAtPosition(worldPos,model.geometry.faces,deformedVertices);
            handles.push(newHandle);
            $('.infoText').text('Compilation started! Adding marker! Please Wait..');
            setTimeout( function(){ compilation(handles,originalVertices,barycentricCoordMode,
              function(){ 
                $('.infoText').text('Compilation finished! Can drag model!');
                drawHandle(newHandle); 
                }); 
              }, 20);
          }
        }else{
          var nearestVertex = null;
          var nearestVertexIndex = getNearestModelVertexIndex(x,y,deformedVertices);
          var newHandle = null;
                
          if(handleExists(nearestVertexIndex)){
            selectedHandle = getHandle(nearestVertexIndex);
            clickedOnHandle = true;
          }else{
            clickedOnHandle = false;
            if(nearestVertexIndex != null){
              newHandle = createHandleAtVertex(nearestVertexIndex,deformedVertices);
              handles.push(newHandle);
              $('.infoText').text('Compilation started! Adding marker! Please Wait..');
              setTimeout( function(){ compilation(handles,originalVertices,barycentricCoordMode,
                function(){ 
                  $('.infoText').text('Compilation finished! Can drag model!');
                  drawHandle(newHandle); 
                  }); 
                }, 20);
            }else{
              console.log('No vertex found!');
            }
          }
        }
        
      }
    }).contextmenu(function(event) {
      
      if(keyFrameMode){
        $('.infoText').text('Viewing Keyframe. Please click "Reset" to start again.');
        return false;
      }
      
      var x = event.clientX;
      var y = event.clientY;
      var handleToRemove = null;
      
      if(barycentricCoordMode){
        var nearestHandleIndex = getNearestHandleIndex(x,y,deformedVertices);
        if(handleExistsBaryCentricMode(nearestHandleIndex)){
          handleToRemove = getHandleBaryCentricMode(nearestHandleIndex);
          eraseHandle(handleToRemove); 
          handles.splice(nearestHandleIndex,1);
          $('.infoText').text('Compilation started! Removing marker! Please Wait..');
          setTimeout( function(){ compilation(handles,originalVertices,barycentricCoordMode,
            function(){ 
              $('.infoText').text('Compilation finished! Can drag model!');
              }); 
            }, 20);
        }
      }else{
        var nearestVertexIndex = getNearestModelVertexIndex(x,y,deformedVertices);
        if(handleExists(nearestVertexIndex)){
          handleToRemove = getHandle(nearestVertexIndex);
          eraseHandle(handleToRemove);
          handles = handles.filter(it => it.v_index != handleToRemove.v_index);
          $('.infoText').text('Compilation started! Removing marker! Please Wait..');
          setTimeout( function(){ compilation(handles,originalVertices,barycentricCoordMode, 
            function(){ 
              $('.infoText').text('Compilation finished! Can drag model!');
              }); 
            }, 20);
        }        
      }
      return false;
    }).mousemove(function(event) {
      
      if(keyFrameMode){
        $('.infoText').text('Viewing Keyframe. Please click "Reset" to start again.');
        return false;
      }
      
      if(clickedOnHandle){        
        var x = event.clientX;
        var y = event.clientY;
        var mouseTarget = getPointInWorldCoordinates(x,y);
        
        //this will update handles[i] element that is selectedHandle
        selectedHandle.position.x = mouseTarget.x;
        selectedHandle.position.y = mouseTarget.y;
        
        // model might not have loaded so might need to moved listeners to after the 
        // model has loaded
        newVertices = manipulation(handles,edges,originalVertices);
        for (var i = 0; i < newVertices.length; i++) {
          model.geometry.vertices[i].x = newVertices[i].x;
          model.geometry.vertices[i].y = newVertices[i].y;
        }

        model.geometry.verticesNeedUpdate = true;    
        updateScene();
      }
    }).mouseup(function(event) {      
      if(clickedOnHandle){
        clickedOnHandle = false;
      }
    });
  }
  
  $('.captureKeyframe').click(function(event) {
    updateScene();
    var webglImage = (function convertCanvasToImage(canvas) {
      var image = new Image(canvas.width/10,canvas.height/10);
      image.src = canvas.toDataURL('image/png');
      return image;
    })(document.querySelectorAll('canvas')[0]);
    
    var frame = new Frame(cloneVertices(model.geometry.vertices),cloneHandles(handles),noFrame);
    frames.push(frame);
    noFrame++;

    $('.framesContainer').prepend(webglImage);
    updateFrameListeners();
  });
  
  function updateFrameListeners(){
    $('.framesContainer > img').click(function(event) { 
      for (var i = 0; i < frames[$(this).index()].vertices.length; i++) {
        model.geometry.vertices[i].x = frames[$(this).index()].vertices[i].x;
        model.geometry.vertices[i].y = frames[$(this).index()].vertices[i].y;
        deformedVertices = cloneVertices(model.geometry.vertices);
      }
      model.geometry.verticesNeedUpdate = true;
      
      for (var i = 0; i < handles.length; i++) {
        eraseHandle(handles[i]);
      }
      handles = [];
      
      for (var i = 0; i < frames[$(this).index()].handles.length; i++) {
        handles.push(frames[$(this).index()].handles[i]);
        drawHandle(frames[$(this).index()].handles[i]);
      }
      
      updateScene();
      keyFrameMode = true;
    });
  }
  
  $('.reset').click(function(event) {
    localStorage.clear();
    location.reload();
  });
  
  $('.zoomIn').click(function(event) {
    camera.position.z-=0.2;
    updateScene();
  });
  
  $('.zoomOut').click(function(event) {
    camera.position.z+=0.2;
    updateScene();
  });
  
  $('.boxObj').click(function(event) {
    localStorage.setItem("model", 'models/box.obj');
    location.reload();
  });
  
  $('.manObj').click(function(event) {
    localStorage.setItem("model", 'models/man.obj');
    location.reload();
  });
  
  $('.barycentricCoord').click(function(event) {
    if(localStorage.getItem("barycentricCoord") == 'true'){
      localStorage.setItem("barycentricCoord", 'false');
    }else{
      localStorage.setItem("barycentricCoord", 'true');
    }
    location.reload();
  });
  
  $('.weightInput').keyup(function(event) {
    w = parseInt($('.weightInput').val());
    $('.infoText').text('Setting weight (w) to: '+$('.weightInput').val());
  });
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(cameraPosition.x,cameraPosition.y,cameraPosition.z);
  camera.lookAt(origin);
  
  var light = new THREE.PointLight('red',1,0);
  light.position.set( 10, 10, 10 );
  scene.add(light);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: drawingSurface });
  renderer.setPixelRatio(window.devicePixelRatio); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.render(scene, camera);
  
  loadObj(objFile);
  renderAxes();
};

function updateScene(){
  renderer.render(scene, camera);
};

function loadObj(objPath){
  var loader = new THREE.OBJLoader();
  loader.load(
    objPath,
    function ( object ) {
      child = object.children[0];
      var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
      geometry.mergeVertices();      
      var material = new THREE.MeshBasicMaterial({wireframe: true});
      model = new THREE.Mesh(geometry, material);
      
      scene.add(model);
      initializeFromMesh(model);
      updateScene();
    },
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
      console.log( 'An error happened' );
    }
  );
};

function initializeFromMesh(mesh){
  faces = mesh.geometry.faces;
  for (var i = 0; i < faces.length; i++) {
    var currentEdge1 = new Edge(faces[i].a,faces[i].b,i);
    var currentEdge2 = new Edge(faces[i].b,faces[i].c,i);
    var currentEdge3 = new Edge(faces[i].a,faces[i].c,i);
    
    if(!Edge.edgeDoesExist(edges,currentEdge1)){ edges.push(currentEdge1); }
    if(!Edge.edgeDoesExist(edges,currentEdge2)){ edges.push(currentEdge2); }
    if(!Edge.edgeDoesExist(edges,currentEdge3)){ edges.push(currentEdge3); }  
  }
  
  for (var i = 0; i < edges.length; i++) {
    if(isBorderEdge(edges[i],faces)){
      edges[i].setIsBorderEdge(true);
    }else{
      edges[i].setIsBorderEdge(false);
    }
  }
  
  var allEdges = Edge.getAllEdges(faces);
  for (var i = 0; i < edges.length; i++) {
    var neighbors = Edge.getEdgeNeighbors(edges[i],allEdges,faces);
    edges[i].setNeighbors(neighbors);
  }
  
  originalVertices = cloneVertices(model.geometry.vertices);
  deformedVertices = cloneVertices(model.geometry.vertices);
  registration(edges,originalVertices);
}

function getNearestModelVertexIndex(x,y,vertices){
  var mouseTarget = getPointInWorldCoordinates(x,y);
  var distanceFromVertex = 0;
  var distanceTolerance = cameraPosition.z/100;;
  var closestVertexIndex = null;
  
  for (var i = 0; i < vertices.length; i++) {
    distanceFromVertex = vertices[i].distanceTo(mouseTarget);
    if(distanceFromVertex < distanceTolerance){
        closestVertexIndex = i;
        distanceTolerance = distanceFromVertex;
    }
  }
  
  return closestVertexIndex;
}

function getNearestHandleIndex(x,y,vertices){
  var mouseTarget = getPointInWorldCoordinates(x,y);
  var distanceFromHandle = 0;
  var distanceTolerance = cameraPosition.z/100;
  var closestHandleIndex = null;
  
  for (var i = 0; i < handles.length; i++) {
    distanceFromHandle = handles[i].position.distanceTo(mouseTarget);
    if(distanceFromHandle < distanceTolerance){
        closestHandleIndex = i;
        distanceTolerance = distanceFromHandle;
    }
  }
  
  return closestHandleIndex;
}

function createHandleAtVertex(index,vertices){
  var vertex = vertices[index];
  var newHandle = null;
  var uniformScale = cameraPosition.z / 120;
  var geometry = new THREE.SphereGeometry( 1, 32, 32 );
  var material = new THREE.MeshPhongMaterial({shininess: 1});
  var newHandle = new THREE.Mesh( geometry, material );
  
  newHandle.position.set(vertex.x,vertex.y,vertex.z);
  newHandle.scale.set(uniformScale,uniformScale,uniformScale);
  newHandle.v_index = index;
  
  return newHandle;
}

function drawHandle(handle){
  scene.add(handle);  
  updateScene();
}

function eraseHandle(handle){
  for (var i = 0; i < handles.length; i++) {
    if(handles[i].v_index == handle.v_index){
      scene.remove(handle);
      break;
    }
  }
  updateScene();
}

function handleExists(modelVertexIndex){
  exists = false;
  for (var i = 0; i < handles.length; i++) {
    if(handles[i].v_index == modelVertexIndex){
      exists = true;
      return exists;
    }
  }
  return exists;
}

function handleExistsBaryCentricMode(index){
  exists = false;
  for (var i = 0; i < handles.length; i++) {
    if(i == index){
      exists = true;
      return exists;
    }
  }
  return exists;
}

function getHandleBaryCentricMode(index){
  handle = null;
  for (var i = 0; i < handles.length; i++) {
    if(i == index){
      handle = handles[i];
      return handle;
    }
  }
  return handle;
}

function getHandle(modelVertexIndex){
  handle = null;
  for (var i = 0; i < handles.length; i++) {
    if(handles[i].v_index == modelVertexIndex){
      handle = handles[i];
      return handle;
    }
  }
  return handle;
}

function createHandleAtPosition(worldPos,faces,vertices){
  var triangles = createTrianglesFromFaces(model.geometry.faces,vertices);
  var newHandle = null;
  var uniformScale = cameraPosition.z / 120;
  for (var i = 0; i < triangles.length; i++) {
    if(triangles[i].containsPoint(worldPos)){

      var x1y1 = new THREE.Vector3(triangles[i].a.x,triangles[i].a.y,triangles[i].a.z);
      var x2y2 = new THREE.Vector3(triangles[i].b.x,triangles[i].b.y,triangles[i].b.z);
      var x3y3 = new THREE.Vector3(triangles[i].c.x,triangles[i].c.y,triangles[i].c.z);
      
      var triangleA  = new THREE.Triangle(x3y3,x2y2,x1y1);
      var triangleA1 = new THREE.Triangle(x3y3,x2y2,worldPos);
      var triangleA2 = new THREE.Triangle(x1y1,x3y3,worldPos);
      var triangleA3 = new THREE.Triangle(x1y1,x2y2,worldPos);
      
      var areaA = triangleA.area();
      var areaA1 = triangleA1.area();
      var areaA2 = triangleA2.area();
      var areaA3 = triangleA3.area();
      
      var l1 = areaA1/areaA;
      var l2 = areaA2/areaA;
      var l3 = areaA3/areaA;
      
      x1y1 = x1y1.multiplyScalar(l1);
      x2y2 = x2y2.multiplyScalar(l2);
      x3y3 = x3y3.multiplyScalar(l3);
      
      var p = x1y1.add(x2y2).add(x3y3);
      
      var geometry = new THREE.SphereGeometry( 1, 32, 32 );
      var material = new THREE.MeshPhongMaterial({shininess: 1});
      newHandle = new THREE.Mesh( geometry, material );
      newHandle.position.set(p.x,p.y,p.z);
      newHandle.scale.set(uniformScale,uniformScale,uniformScale);
      newHandle.l1 = l1;
      newHandle.l2 = l2; 
      newHandle.l3 = l3;
      newHandle.triangleV1Index = triangles[i].v1Index;
      newHandle.triangleV2Index = triangles[i].v2Index;
      newHandle.triangleV3Index = triangles[i].v3Index;
    }
  }
  
  return newHandle;
}

function getPointInWorldCoordinates(x,y){
  var vector = new THREE.Vector3();
  vector.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
  vector.unproject( camera );
  var dir = vector.sub( camera.position ).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  
  return pos;
};

function animate(){
  requestAnimationFrame(animate);
  updateScene();
};