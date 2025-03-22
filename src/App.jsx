// src/App.jsx
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { 
  OrbitControls, 
  Stars,
  useGLTF,
  Stats,
  Html,
  useBounds,
  PerspectiveCamera
} from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'

// Array of slide paths - replace with your actual slide paths
const slidePaths = [
  '/slides/slide-1.jpg',
  '/slides/slide-2.jpg',
  // '/slides/slide-3.jpg',
  // '/slides/slide-4.jpg',
  // '/slides/slide-5.jpg',
  '/slides/slide-6.jpg',
  '/slides/slide-7.jpg',
  '/slides/slide-8.jpg',
  '/slides/slide-9.jpg',
  '/slides/slide-10.jpg',
  '/slides/slide-11.jpg',
  '/slides/slide-12.jpg',
  '/slides/slide-13.jpg',
  '/slides/slide-14.jpg',
  '/slides/slide-15.jpg',
  '/slides/slide-16.jpg',
  '/slides/slide-17.jpg',
  '/slides/slide-18.jpg',
  '/slides/slide-19.jpg',
]

// Slide component - update the handleClick function
function Slide({ texture, index, currentSlide, totalSlides, onClick, position }) {
  const meshRef = useRef()
  const isActive = index === currentSlide
  
  // Animation when slide changes
  useEffect(() => {
    if (!meshRef.current) return
    
    const offset = index - currentSlide
    
    // Position slides horizontally
    gsap.to(meshRef.current.position, {
      x: offset * 1.5,
      duration: 0.8,
      ease: "power3.inOut"
    })
    
    // Set opacity based on distance from current slide
    const targetOpacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.3
    gsap.to(meshRef.current.material, {
      opacity: targetOpacity,
      duration: 0.5,
    })
    
    // Scale active slide slightly
    gsap.to(meshRef.current.scale, {
      x: isActive ? 1.05 : 1,
      y: isActive ? 1.05 : 1,
      duration: 0.5,
    })
  }, [currentSlide, index])
  
  // Click animation - zoom effect instead of laying down
  const handleClick = () => {
    if (!isActive) return
    
    // Don't animate the slide itself, just trigger the callback
    // for the camera zoom effect
    if (onClick) onClick()
  }
  
  // Calculate aspect ratio to prevent stretching
  const aspectRatio = texture.image ? texture.image.width / texture.image.height : 16/9
  const slideWidth = 1
  const slideHeight = slideWidth / aspectRatio
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = isActive ? 'pointer' : 'default'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      <planeGeometry args={[slideWidth, slideHeight]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        transparent
        opacity={1}
      />
    </mesh>
  )
}

// Camera controller for presentation with improved transitions
function PresentationCamera({ slideLayedDown }) {
  const { camera } = useThree()
  const initialPosRef = useRef({ x: 0, y: 0, z: 2 })
  const isInitializedRef = useRef(false)
  
  useEffect(() => {
    // Save initial camera position on first render
    if (!isInitializedRef.current) {
      initialPosRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      }
      isInitializedRef.current = true
      
      // Set initial position
      camera.position.set(0, 0, 2)
      camera.lookAt(0, 0, 0)
    }
    
    // Animate camera to zoom into slide
    if (slideLayedDown) {
      gsap.to(camera.position, {
        z: 0.7, // Zoom in closer to the slide
        duration: 1.2,
        ease: "power2.inOut",
      })
    } else {
      // Ensure we have a smooth transition back to the initial position
      gsap.to(camera.position, {
        z: initialPosRef.current.z, // Use the saved initial position
        duration: 1,
        ease: "power2.inOut", 
      })
    }
  }, [camera, slideLayedDown])
  
  // Update camera position on each frame to ensure smooth transitions
  useFrame(() => {
    camera.lookAt(0, 0, 0)
  })
  
  return null
}

// Slideshow controller
function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideLayedDown, setSlideLayedDown] = useState(false)
  const textures = useLoader(THREE.TextureLoader, slidePaths)
  
  // Navigate to previous slide
  const prevSlide = () => {
    if (slideLayedDown) return
    setCurrentSlide(current => (current > 0 ? current - 1 : current))
  }
  
  // Navigate to next slide
  const nextSlide = () => {
    if (slideLayedDown) return
    setCurrentSlide(current => (current < textures.length - 1 ? current + 1 : current))
  }
  
  // Toggle slide laydown state
  const toggleSlideLaydown = () => {
    setSlideLayedDown(!slideLayedDown)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'ArrowRight') nextSlide()
      if (e.key === ' ' || e.key === 'Enter') toggleSlideLaydown()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slideLayedDown])
  
  return (
    <>
      <PresentationCamera slideLayedDown={slideLayedDown} />
      
      {textures.map((texture, index) => (
        <Slide 
          key={index}
          texture={texture}
          index={index}
          currentSlide={currentSlide}
          totalSlides={textures.length}
          onClick={toggleSlideLaydown}
          position={[index * 1.5, 0, 0]}
        />
      ))}
      
      {/* Navigation buttons */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div style={{
        position: 'absolute',
        bottom: '50%',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'none',
        transform: 'translateY(25px)' // Center vertically
      }}>
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0 || slideLayedDown}
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            minWidth: '50px',  // Prevent shrinking
            minHeight: '50px', // Prevent shrinking
            fontSize: '24px',  // Slightly larger font
            fontFamily: 'sans-serif', // Consistent font
            cursor: currentSlide === 0 || slideLayedDown ? 'default' : 'pointer',
            opacity: currentSlide === 0 || slideLayedDown ? 0.3 : 1,
            pointerEvents: 'auto',
            display: 'flex',   // Center the arrow
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',      // Remove default padding
            lineHeight: '1',   // Improve vertical centering
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)' // Subtle shadow
          }}
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === textures.length - 1 || slideLayedDown}
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            minWidth: '50px',  // Prevent shrinking
            minHeight: '50px', // Prevent shrinking
            fontSize: '24px',  // Slightly larger font
            fontFamily: 'sans-serif', // Consistent font
            cursor: currentSlide === textures.length - 1 || slideLayedDown ? 'default' : 'pointer',
            opacity: currentSlide === textures.length - 1 || slideLayedDown ? 0.3 : 1,
            pointerEvents: 'auto',
            display: 'flex',   // Center the arrow
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',      // Remove default padding
            lineHeight: '1',   // Improve vertical centering
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)' // Subtle shadow
          }}
        >
          →
        </button>
      </div>
        
        {/* Slide counter */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif'
        }}>
          {currentSlide + 1} / {textures.length}
        </div>
        
        {/* Instructions */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <p>← → : Navigate slides</p>
          <p>Click slide: Toggle presentation mode</p>
        </div>
      </Html>
    </>
  )
}

// Rotating stars component
function RotatingStars() {
  const starsRef = useRef()
  
  // Apply slow rotation animation
  useFrame(({ clock }) => {
    if (starsRef.current) {
      // Extremely slow rotation - adjust the multipliers to change speed
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.02
      starsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.01
    }
  })
  
  return (
    <group ref={starsRef}>
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0}
        fade
      />
    </group>
  )
}

// Main App component
export default function App() {
  const [showStats, setShowStats] = useState(false)
  
  // Toggle performance stats with 'S' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 's') {
        setShowStats(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true }}
      >
        {/* Performance stats - toggle with 'S' key */}
        {showStats && <Stats />}
        
        {/* Night sky with stars */}
        <color attach="background" args={['#020209']} />
        <fog attach="fog" args={['#020209', 10, 50]} />
        <RotatingStars />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.5} color="#ffffff" />
        
        {/* Slideshow component */}
        <Slideshow />
      </Canvas>
    </div>
  )
}