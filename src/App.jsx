// src/App.jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box } from '@react-three/drei'
import { DragControls } from '@react-three/drei'
import { useGLTF, Html } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'

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
    <Box ref={meshRef}>
      <meshStandardMaterial color="cyan" />
    </Box>
  )
}

function Model({ url }) {
  const { scene, nodes, materials } = useGLTF(url)
  const [clicked, setClicked] = useState(false)

  return (
    <primitive 
      object={scene}
      scale={clicked ? 1.2 : 1}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <Html distanceFactor={10}>
        <div className="model-label">Click me!</div>
      </Html>
    </primitive>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]}>
          <meshStandardMaterial color="orange" />
        </Box>
        <Box position={[1.2, 0, 0]}>
          <meshStandardMaterial color="hotpink" />
        </Box>
        <DraggableBox />
        <InteractiveBox />
        <RotatingBox />
        <Model url="/models/fire_axe.gltf" />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}