const Modal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Dark overlay */}
        <div className="fixed inset-0 backdrop-blur bg-black bg-opacity-50" onClick={onClose}></div>
  
        {/* Modal center positioning */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          {/* Modal content */}
          <div 
            className="relative bg-white rounded-lg w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">{title}</h3>
              <div className="mb-6">{children}</div>
              <div className="flex justify-end space-x-3">
                {actions}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default Modal;