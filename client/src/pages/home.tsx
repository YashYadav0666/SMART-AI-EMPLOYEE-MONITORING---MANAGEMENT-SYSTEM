import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import EmployeeNameModal from "@/components/employee-name-modal";
import { FaUserTie, FaChartLine, FaCamera, FaLaptopCode, FaBrain, FaRegClock, FaUsers } from "react-icons/fa";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle employee join button click
  const handleEmployeeJoin = () => {
    setIsModalOpen(true);
  };
  
  // Handle host join button click
  const handleHostJoin = () => {
    setLocation("/host");
  };
  
  // Handle name submission from modal
  const handleNameSubmit = (name: string) => {
    // Store employee name in sessionStorage for persistence
    sessionStorage.setItem("employeeName", name);
    setLocation("/employee");
  };

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 10
      }
    }
  };

  const cardVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section with gradient background */}
      <div className="bg-gradient-to-br from-primary/90 via-primary to-secondary text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Employee Monitoring System
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Advanced real-time productivity tracking with AI-powered behavior analysis
            </p>
          </motion.div>
          
          {/* Feature overview */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-sm md:text-base"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex flex-col items-center" variants={itemVariants}>
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl mb-3">
                <FaCamera className="w-6 h-6" />
              </div>
              <span>Screen Monitoring</span>
            </motion.div>
            
            <motion.div className="flex flex-col items-center" variants={itemVariants}>
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl mb-3">
                <FaBrain className="w-6 h-6" />
              </div>
              <span>AI Behavior Analysis</span>
            </motion.div>
            
            <motion.div className="flex flex-col items-center" variants={itemVariants}>
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl mb-3">
                <FaRegClock className="w-6 h-6" />
              </div>
              <span>Time Tracking</span>
            </motion.div>
            
            <motion.div className="flex flex-col items-center" variants={itemVariants}>
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl mb-3">
                <FaChartLine className="w-6 h-6" />
              </div>
              <span>Productivity Analytics</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Role selection section */}
      <div className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Choose Your Role
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Employee Card */}
            <motion.div 
              className="card-modern overflow-hidden"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="h-64 bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center p-8">
                <FaLaptopCode className="w-20 h-20 text-white/80" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Join as Employee</h3>
                <ul className="space-y-3 mb-6 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Track your productivity metrics
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Submit work and receive feedback
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Maintain accountability
                  </li>
                </ul>
                <button 
                  onClick={handleEmployeeJoin}
                  className="w-full py-3.5 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Join as Employee
                </button>
              </div>
            </motion.div>
            
            {/* Host Card */}
            <motion.div 
              className="card-modern overflow-hidden"
              variants={cardVariants}
              initial="hidden"
              animate="visible" 
              whileHover="hover"
            >
              <div className="h-64 bg-gradient-to-br from-secondary/60 to-primary/60 flex items-center justify-center p-8">
                <FaUsers className="w-20 h-20 text-white/80" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Join as Host</h3>
                <ul className="space-y-3 mb-6 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Monitor employee activities
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    View real-time statistics
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Manage team productivity
                  </li>
                </ul>
                <button 
                  onClick={handleHostJoin}
                  className="w-full py-3.5 px-4 rounded-lg bg-secondary text-white font-medium hover:bg-secondary/90 transition-colors shadow-sm"
                >
                  Join as Host
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-10 bg-muted">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Employee Monitoring System. All rights reserved.</p>
        </div>
      </footer>
      
      <EmployeeNameModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNameSubmit}
      />
    </div>
  );
}
