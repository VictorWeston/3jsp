// src/App.jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Plane } from '@react-three/drei'
import { DragControls } from '@react-three/drei'
import { useGLTF, Html } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { Vector3, Euler, Quaternion  } from 'three'
import { useThree } from '@react-three/fiber'
import { Physics, useBox, usePlane } from '@react-three/cannon'


function DraggableBox() {
  return (
    <DragControls>
      <Box position={[0, 2, 0]}>
        <meshStandardMaterial color="limegreen" />
      </Box>
    </DragControls>
  )
}

function InteractiveBox() {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef()

  return (
    <Box
      ref={meshRef}
      position={[0, 1, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        gsap.to(meshRef.current.position, {
          y: Math.random() * 3,
          duration: 0.5
        })
      }}
    >
      <meshStandardMaterial 
        color={hovered ? "hotpink" : "orange"} 
        metalness={hovered ? 1 : 0.5}
      />
    </Box>
  )
}

function RotatingBox() {
  const meshRef = useRef()
  
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta // delta = time since last frame
  })

  return (
    <DragControls>
    <Box ref={meshRef}>
      <meshStandardMaterial color="cyan" />
    </Box>
    </DragControls>
  )
}
//free_car_001.gltf
function RotatingModel({ url }) {
  const { scene, nodes, materials } = useGLTF(url)
  const [clicked, setClicked] = useState(false)
  const modelRef = useRef()
  const [time, setTime] = useState(0)
  
  
  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5 // Rotate at half speed

      // Update time for animations
      setTime(prevTime => prevTime + delta)
      
      // Scale animation (pulsing effect)
      const scaleBase = clicked ? 1.2 : 1
      const scaleVariation = 0.1 * Math.sin(time * 2) // Subtle pulsing effect
      modelRef.current.scale.set(
        scaleBase + scaleVariation,
        scaleBase + scaleVariation,
        scaleBase + scaleVariation
      )
      
      // Y-axis movement (floating up and down)
      const yPosition = 0.3 * Math.sin(time * 1.5) // Smooth up and down movement
      modelRef.current.position.y = yPosition

    }
  })
  return (
    <DragControls>
    <primitive 
      ref={modelRef}
      object={scene}
      scale={clicked ? 1.2 : 1}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
    </primitive>
    <Html distanceFactor={10} position={[0, 15, 0]}>
        <div className="model-label"style={{
            fontSize: '5rem',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
          }}>Click me!</div>
      </Html>
    </DragControls>
  )
}


// Camera controller component
function CameraController({ cameraPositions, lookAtPoint }) {
  const { camera } = useThree()
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Set initial camera position and lookAt
  useEffect(() => {
    if (cameraPositions.length > 0) {
      camera.position.copy(cameraPositions[0])
      camera.lookAt(lookAtPoint)
    }
  }, [])
  
  // Function to move camera to a specific position
  const moveCamera = (index) => {
    if (isAnimating || index === currentPositionIndex) return
    
    setIsAnimating(true)
    
    // Animate camera movement
    gsap.to(camera.position, {
      x: cameraPositions[index].x,
      y: cameraPositions[index].y,
      z: cameraPositions[index].z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(lookAtPoint)
      },
      onComplete: () => {
        setCurrentPositionIndex(index)
        setIsAnimating(false)
      }
    })
  }
  
  // Render camera control buttons
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="camera-controls" style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        {cameraPositions.map((_, index) => (
          <button
            key={index}
            onClick={() => moveCamera(index)}
            disabled={isAnimating || index === currentPositionIndex}
            style={{
              padding: '8px 16px',
              backgroundColor: index === currentPositionIndex ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isAnimating ? 'not-allowed' : 'pointer',
              opacity: isAnimating ? 0.7 : 1
            }}
          >
            View {index + 1}
          </button>
        ))}
      </div>
    </Html>
  )
}

// Ground plane with collision
function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], // Rotated to be horizontal
    position: [0, -1, 0],
    type: 'Static'
  }))
  
  return (
    <Plane 
      ref={ref} 
      args={[20, 20]} 
      receiveShadow
    >
      <meshStandardMaterial color="#303030" />
    </Plane>
  )
}

// Player cube with WASD controls
function PlayerCube({ followCamera }) {
  const [cubeRef, api] = useBox(() => ({ 
    mass: 1,
    position: [0, 0, 0],
    args: [1, 1, 1]
  }))
  
  const velocity = useRef([0, 0, 0])
  const position = useRef([0, 0, 0])
  const [moveDirection, setMoveDirection] = useState({ forward: 0, right: 0 })
  const speed = 5
  const { camera } = useThree()
  const cameraAngle = useRef(0) // Camera angle around player
  
  // Store velocity and position
  useEffect(() => {
    const unsubVelocity = api.velocity.subscribe(v => velocity.current = v)
    const unsubPosition = api.position.subscribe(p => position.current = p)
    return () => {
      unsubVelocity()
      unsubPosition()
    }
  }, [api])
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key.toLowerCase()) {
        case 'w': setMoveDirection(prev => ({ ...prev, forward: 1 })); break
        case 's': setMoveDirection(prev => ({ ...prev, forward: -1 })); break
        case 'a': setMoveDirection(prev => ({ ...prev, right: -1 })); break // Left is negative
        case 'd': setMoveDirection(prev => ({ ...prev, right: 1 })); break  // Right is positive
        case 'q': if(followCamera) cameraAngle.current -= 0.1; break // Rotate camera left
        case 'e': if(followCamera) cameraAngle.current += 0.1; break // Rotate camera right
      }
    }
    
    const handleKeyUp = (e) => {
      switch(e.key.toLowerCase()) {
        case 'w': case 's': setMoveDirection(prev => ({ ...prev, forward: 0 })); break
        case 'a': case 'd': setMoveDirection(prev => ({ ...prev, right: 0 })); break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [followCamera])
  
  // Move cube based on camera direction
  useFrame(() => {
    if (moveDirection.forward === 0 && moveDirection.right === 0) return
    
    // Get camera direction vectors
    const cameraDirection = new Vector3()
    camera.getWorldDirection(cameraDirection)
    cameraDirection.y = 0
    cameraDirection.normalize()
    
    // Get right vector (perpendicular to camera direction)
    // Fix the direction by switching the signs
    const rightVector = new Vector3(
      -cameraDirection.z,  // Fix: negate this value
      0,
      cameraDirection.x   // Fix: make this positive
    ).normalize()
    
    // Calculate movement vector
    const moveVector = new Vector3()
    moveVector.addScaledVector(cameraDirection, moveDirection.forward * speed)
    moveVector.addScaledVector(rightVector, moveDirection.right * speed)
    
    // Apply velocity
    api.velocity.set(moveVector.x, velocity.current[1], moveVector.z)
    
    // Apply rotation based on movement direction
    if (moveVector.length() > 0) {
      const targetRotation = Math.atan2(moveVector.x, moveVector.z)
      const currentEuler = new Euler(0, 0, 0, 'YXZ')
      const targetQuaternion = new Quaternion().setFromEuler(
        currentEuler.set(0, targetRotation, 0)
      )
      
      api.rotation.copy(targetQuaternion)
    }
  })
  
  // Update camera position if follow mode is enabled
  useFrame(() => {
    if (followCamera) {
      const [x, y, z] = position.current
      const distance = 6 // Distance from player
      const height = 4   // Height above player
      
      // Calculate camera position using angle
      const cameraX = x + Math.sin(cameraAngle.current) * distance
      const cameraZ = z + Math.cos(cameraAngle.current) * distance
      
      // Set camera position and look at player
      camera.position.set(cameraX, y + height, cameraZ)
      camera.lookAt(x, y, z)
    }
  })
  
  return (
    <Box 
      ref={cubeRef} 
      castShadow 
      receiveShadow
    >
      <meshStandardMaterial color="royalblue" />
    </Box>
  )
}

// Toggle button for camera follow mode
function CameraFollowToggle({ isFollowing, setIsFollowing }) {
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          style={{
            padding: '8px 16px',
            backgroundColor: isFollowing ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Camera Follow: {isFollowing ? 'ON' : 'OFF'}
        </button>
      </div>
    </Html>
  )
}

// Controls instructions - Updated with camera pivot instructions
function ControlsInfo() {
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Controls:</h3>
        <p style={{ margin: '5px 0' }}>W - Move forward</p>
        <p style={{ margin: '5px 0' }}>S - Move backward</p>
        <p style={{ margin: '5px 0' }}>A - Move left</p>
        <p style={{ margin: '5px 0' }}>D - Move right</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>In follow mode:</p>
        <p style={{ margin: '5px 0' }}>Q - Rotate camera left</p>
        <p style={{ margin: '5px 0' }}>E - Rotate camera right</p>
      </div>
    </Html>
  )
}


export default function App() {
  const [cameraFollowMode, setCameraFollowMode] = useState(false)
  // Define camera positions and the lookAt point
  const cameraPositions = [
    new Vector3(3, 3, 3),       // Initial position
    new Vector3(-3, 2, 5),      // Position 2
    new Vector3(5, 1, 0),       // Position 3
    new Vector3(0, 5, 5),       // Position 4
    new Vector3(0, 0.5, 10)     // Position 5
  ]

    // Define the point to look at (center of the scene)
    const lookAtPoint = new Vector3(0, 0, 0)
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
         {/* Camera Controller */}
         {/* Only show camera controller when not in follow mode */}
        {!cameraFollowMode && (
          <CameraController 
            cameraPositions={cameraPositions} 
            lookAtPoint={lookAtPoint} 
          />
        )}
        <CameraFollowToggle 
          isFollowing={cameraFollowMode} 
          setIsFollowing={setCameraFollowMode} 
        />
        <ControlsInfo />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Physics gravity={[0, -9.8, 0]}>
          <Ground />
          <PlayerCube followCamera={cameraFollowMode} />
        </Physics>


        <Box position={[-1.2, 0, 0]}>
          <meshStandardMaterial color="orange" />
        </Box>
        <Box position={[1.2, 0, 0]}>
          <meshStandardMaterial color="hotpink" />
        </Box>
        <DraggableBox />
        <InteractiveBox />
        <RotatingBox />
        <RotatingModel url="/models/free_car_001.gltf" />

        <OrbitControls enabled={!cameraFollowMode} makeDefault />
      </Canvas>
    </div>
  )
}