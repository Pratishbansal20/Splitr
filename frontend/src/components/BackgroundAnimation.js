import React from 'react';
import { motion } from 'framer-motion';

const Butterfly = (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 12C12 12 14 8 18 8C22 8 22 12 22 12C22 12 22 16 18 16C14 16 12 12 12 12ZM12 12C12 12 10 8 6 8C2 8 2 12 2 12C2 12 2 16 6 16C10 16 12 12 12 12Z" fill="currentColor" opacity="0.6" />
        <path d="M12 12V8M12 12V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const Bow = (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 12c-2 0-4-3-4-5 0-3 2-4 4-4 2 0 4 1 4 4 0 2-2 5-4 5zm0 0c2 0 4-3 4-5 0-3-2-4-4-4-2 0-4 1-4 4 0 2 2 5 4 5zm0 0l-2 4m2-4l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.4" />
    </svg>
);

const Flower = (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 8c0-2-2-4-4-4s-4 2-4 4 2 4 4 4c-2 0-4 2-4 4s2 4 4 4 4-2 4-4c0 2 2 4 4 4s4-2 4-4-2-4-4-4c2 0 4-2 4-4s-2-4-4-4-4 2-4 4z" fill="currentColor" opacity="0.5" />
        <circle cx="12" cy="12" r="2" fill="#fff" />
    </svg>
);

// Custom Image Components
const CustomFairy = (props) => <img src="/assets/fairy.png" alt="" {...props} style={{ ...props.style, objectFit: 'contain' }} />;
const CustomButterfly = (props) => <img src="/assets/butterfly_custom.png" alt="" {...props} style={{ ...props.style, objectFit: 'contain' }} />;
const CustomBow = (props) => <img src="/assets/bow_custom.png" alt="" {...props} style={{ ...props.style, objectFit: 'contain' }} />;

const FloatingItem = ({ delay, x, y, size, Type, color }) => {
    return (
        <motion.div
            className="absolute pointer-events-none z-0"
            initial={{ x, y, opacity: 0, scale: 0 }}
            animate={{
                y: [y, y - 100, y - 50, y - 150],
                x: [x, x + 30, x - 30, x + 10],
                opacity: [0, 0.9, 0.9, 0],
                rotate: [0, 10, -10, 5],
                scale: [0.8, 1.2, 1, 0.8]
            }}
            transition={{
                duration: 12 + Math.random() * 8,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
            style={{ width: size, height: size, color: color }}
        >
            <Type width="100%" height="100%" style={{ width: '100%', height: '100%' }} />
        </motion.div>
    );
};

const BackgroundAnimation = () => {
    // Generate mixed items
    const items = Array.from({ length: 25 }).map((_, i) => {
        // Mix of SVG shapes and Custom Images
        const types = [Butterfly, Bow, Flower, CustomFairy, CustomButterfly, CustomBow];
        const Type = types[Math.floor(Math.random() * types.length)];
        const colors = ['#fbcfe8', '#e9d5ff', '#c7ceea', '#fecaca'];

        return {
            id: i,
            Type,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 10,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight + 50,
            size: 30 + Math.random() * 30 // Slightly larger for images
        };
    });

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
            {items.map(b => (
                <FloatingItem key={b.id} {...b} />
            ))}
        </div>
    );
};

export default BackgroundAnimation;
