import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmployeeNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function EmployeeNameModal({ isOpen, onClose, onSubmit }: EmployeeNameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }
    
    onSubmit(name.trim());
    setName("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="glass max-w-md w-full p-8 rounded-xl shadow-soft mx-4"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Enter Your Name</h2>
              </div>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Please enter your name to continue to the employee dashboard.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  className={`w-full px-4 py-6 text-lg rounded-lg border-input bg-transparent ${
                    error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary/20'
                  }`}
                  required
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      className="mt-2 text-sm text-destructive flex items-center"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-11 px-4 rounded-lg border border-input bg-background hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
