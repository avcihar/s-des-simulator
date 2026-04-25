document.addEventListener('DOMContentLoaded', () => {
    const uiController = new UITestController();
    
    const diffStepUI = new DiffStepUI();
    const diffStepController = new DiffStepController(diffStepUI);
    diffStepController.init(); 
});

const simulationController = new UISimulator();

window.startSimulation = () => simulationController.startSimulation();
window.changeStep = (dir) => simulationController.changeStep(dir);
window.loadExample = (num) => simulationController.loadExample(num);
window.resetApp = () => simulationController.resetApp();
window.openCoreModal = (idx) => simulationController.openCoreModal(idx);
window.closeCoreModal = () => document.getElementById('core-modal').classList.add('hidden');
window.reverseTest = () => simulationController.reverseTest();