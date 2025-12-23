import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const FloatingParticles = ({ count = 12, minSize = 60, maxSize = 180, speed = 0.5 }) => {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const { themeColor } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles = [];

    // Initialize particles with random positions and velocities
    for (let i = 0; i < count; i++) {
      const size = Math.random() * (maxSize - minSize) + minSize;
      const particle = {
        x: Math.random() * (window.innerWidth - size),
        y: Math.random() * (window.innerHeight - size),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: size,
        element: null,
      };

      // Create DOM element
      const el = document.createElement('div');
      el.className = 'floating-particle';
      el.style.position = 'absolute';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = '50%';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.3';
      el.style.filter = 'blur(40px)';
      el.style.transition = 'background 0.5s ease';
      
      container.appendChild(el);
      particle.element = el;
      particles.push(particle);
    }

    particlesRef.current = particles;

    // Animation loop
    const animate = () => {
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary collision
        if (particle.x <= 0 || particle.x >= window.innerWidth - particle.size) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(particle.x, window.innerWidth - particle.size));
        }
        if (particle.y <= 0 || particle.y >= window.innerHeight - particle.size) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(particle.y, window.innerHeight - particle.size));
        }

        // Particle-to-particle collision
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = (particle.size + other.size) / 2;

          if (distance < minDist) {
            // Calculate collision response
            const angle = Math.atan2(dy, dx);
            const targetX = particle.x + Math.cos(angle) * minDist;
            const targetY = particle.y + Math.sin(angle) * minDist;
            
            const ax = (targetX - other.x) * 0.05;
            const ay = (targetY - other.y) * 0.05;
            
            particle.vx -= ax;
            particle.vy -= ay;
            other.vx += ax;
            other.vy += ay;
          }
        }

        // Apply position to DOM
        if (particle.element) {
          particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      particles.forEach((particle) => {
        particle.x = Math.min(particle.x, window.innerWidth - particle.size);
        particle.y = Math.min(particle.y, window.innerHeight - particle.size);
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      particles.forEach((particle) => {
        if (particle.element && particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      });
    };
  }, [count, minSize, maxSize, speed]);

  // Update particle colors when theme changes
  useEffect(() => {
    particlesRef.current.forEach((particle) => {
      if (particle.element) {
        particle.element.style.background = `radial-gradient(circle, ${themeColor}, transparent)`;
      }
    });
  }, [themeColor]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
};

export default FloatingParticles;
