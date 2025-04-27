import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileType, Lock, Info } from "lucide-react";

interface SubmitWorkProps {
  employeeId: number;
  onSubmit: (fileName: string) => void;
}

export default function SubmitWork({ employeeId, onSubmit }: SubmitWorkProps) {
  const [description, setDescription] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mutation for submitting work
  const submitWorkMutation = useMutation({
    mutationFn: async (data: {
      employeeId: number;
      description: string;
      fileData: string;
      fileName: string;
      fileSize: number;
    }) => {
      return apiRequest("POST", "/api/work-submissions", data);
    },
    onSuccess: () => {
      // Reset form
      setDescription("");
      setFileData(null);
      setFileName("");
      setFileSize(0);
      
      // Show success message
      toast({
        title: "Work submitted successfully",
        description: "Your work has been submitted to the system.",
        variant: "default",
      });
      
      // Notify parent component
      onSubmit(fileName);
    },
    onError: (error) => {
      console.error("Error submitting work:", error);
      toast({
        title: "Error submitting work",
        description: "There was a problem submitting your work. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setFileName(file.name);
    setFileSize(file.size);
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Get just the base64 part without the data URL prefix
        const base64Data = result.split(",")[1];
        setFileData(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of your work.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fileData) {
      toast({
        title: "File required",
        description: "Please attach a file to submit.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await submitWorkMutation.mutateAsync({
        employeeId,
        description,
        fileData,
        fileName,
        fileSize
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Submit Your Work</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              placeholder="Describe your completed tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="work-file"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="work-file" className="cursor-pointer block">
                <div className="flex flex-col items-center">
                  {fileData ? (
                    <>
                      <FileType className="h-10 w-10 text-blue-500 mb-2" />
                      <p className="text-gray-800 font-medium">{fileName}</p>
                      <p className="text-gray-500 text-sm mt-1">{formatFileSize(fileSize)}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-500">Click to select file or drag and drop</p>
                      <p className="text-gray-400 text-sm mt-1">PDF, DOC, XLS, PPT, JPG, PNG (max 10MB)</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !description || !fileData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? "Submitting..." : "Submit Work"}
            </Button>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="border-t border-gray-200 px-6 py-3 bg-blue-50">
        <div className="flex items-center text-sm text-blue-600">
          <Lock className="h-4 w-4 mr-2" />
          <span>Your work will be uploaded and securely saved. Host will be able to download your submissions.</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 p-0"
            onClick={() => toast({
              title: "File Information",
              description: "Your work submissions are securely stored in our system. Hosts can download and review your submissions.",
              variant: "default",
            })}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
