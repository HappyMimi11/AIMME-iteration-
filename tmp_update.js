const fs = require('fs');

const filePath = 'client/src/pages/session-page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Update both remaining "View Details" buttons
const buttonReplacement = 
  `className="text-xs p-0 h-8 px-2"
                        onClick={() => {
                          setSelectedSession(session);
                          setDetailDialogOpen(true);
                        }}`;

const updatedContent = content.replace(/className="text-xs p-0 h-8 px-2"/g, buttonReplacement);

// Add the missing SessionDetailDialog component at the end of the file
const dialogComponentToAdd = `
      
      {/* Session Detail Dialog */}
      <SessionDetailDialog 
        session={selectedSession}
        isOpen={detailDialogOpen}
        onClose={handleSessionDetailClose}
      />`;

// Find the closing </Dialog> of the Create Session Dialog
const insertPosition = updatedContent.lastIndexOf("</Dialog>");
const finalPosition = updatedContent.indexOf("</div>", insertPosition) + 6;

const finalContent = 
  updatedContent.substring(0, finalPosition) + 
  dialogComponentToAdd + 
  updatedContent.substring(finalPosition);

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('File updated successfully');
