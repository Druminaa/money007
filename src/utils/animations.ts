// Global animation configurations
export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Staggered list items
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  },

  // Cards
  card: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    whileHover: { y: -2, scale: 1.02 },
    transition: { duration: 0.2 }
  },

  // Buttons
  button: {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },

  // Modal
  modal: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 }
  },

  // Progress bars
  progressBar: {
    initial: { width: 0 },
    animate: { width: "100%" },
    transition: { duration: 1.2, ease: "easeOut" }
  },

  // Icons
  icon: {
    whileHover: { rotate: 5, scale: 1.1 },
    transition: { duration: 0.2 }
  },

  // Form inputs
  input: {
    whileFocus: { scale: 1.02, borderColor: "#3b82f6" },
    transition: { duration: 0.2 }
  },

  // Loading
  loading: {
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 1.5, repeat: Infinity }
  },

  // Success/Error feedback
  shake: {
    animate: { x: [0, -10, 10, -10, 10, 0] },
    transition: { duration: 0.5 }
  },

  // Fade in view
  fadeInView: {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  }
}

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}