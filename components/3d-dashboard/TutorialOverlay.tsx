'use client';
import React, { useState, useEffect } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  position: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to 3D Dashboard",
    description: "This interactive visualization shows APML's logistics network across India.",
    position: "center"
  },
  {
    title: "Earth View",
    description: "The globe will automatically rotate to give you a full view of the world.",
    position: "center-right"
  },
  {
    title: "Branch Locations",
    description: "Red pins mark APML branch locations across India.",
    position: "bottom-center"
  },
  {
    title: "Analytics Dashboard",
    description: "After the animation, you'll see a 3D analytics dashboard with vehicle statistics.",
    position: "center-left"
  }
];

const TutorialOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [hasShownTutorial, setHasShownTutorial] = useState(false);

  useEffect(() => {
    // Check if tutorial has been shown before
    const tutorialShown = localStorage.getItem('apml_3d_tutorial_shown');
    if (tutorialShown === 'true') {
      setVisible(false);
      setHasShownTutorial(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('apml_3d_tutorial_shown', 'true');
    setVisible(false);
    setHasShownTutorial(true);
    onClose();
  };

  if (!visible) return null;

  const currentTutorial = tutorialSteps[currentStep];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-40 pointer-events-auto" onClick={completeTutorial}></div>
      
      <div 
        className={`bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl p-6 max-w-md pointer-events-auto transition-all duration-500 transform ${getPositionClass(currentTutorial.position)}`}
      >
        <h3 className="text-xl font-bold text-white mb-2">{currentTutorial.title}</h3>
        <p className="text-gray-300 mb-5">{currentTutorial.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-blue-500' : 'bg-gray-500'}`}
              ></div>
            ))}
          </div>
          
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button 
                onClick={prevStep}
                className="px-3 py-2 text-xs font-medium text-white rounded-md hover:bg-[#334155] focus:outline-none"
              >
                Back
              </button>
            )}
            
            <button 
              onClick={nextStep}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Got it!'}
            </button>
            
            <button
              onClick={completeTutorial}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get positioning class based on position string
const getPositionClass = (position: string): string => {
  switch (position) {
    case 'center':
      return 'translate-y-0';
    case 'center-right':
      return 'translate-x-24';
    case 'center-left':
      return 'translate-x-[-24]';
    case 'bottom-center':
      return 'translate-y-24';
    case 'top-center':
      return 'translate-y-[-24]';
    default:
      return '';
  }
};

export default TutorialOverlay; 