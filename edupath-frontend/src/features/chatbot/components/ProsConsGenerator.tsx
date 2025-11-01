import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import api from '../../../services/api';

interface ProsConsData {
  id: string;
  career_name: string;
  course_name?: string;
  pros: string[];
  cons: string[];
  context: string;
  generated_by: string;
  created_at: string;
}

interface ProsConsGeneratorProps {
  careerName?: string;
  courseName?: string;
  onGenerated?: (data: ProsConsData) => void;
  className?: string;
}

export default function ProsConsGenerator({ 
  careerName = '', 
  courseName = '', 
  onGenerated,
  className = '' 
}: ProsConsGeneratorProps) {
  const [career, setCareer] = useState(careerName);
  const [course, setCourse] = useState(courseName);
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProsConsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!career.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const data = await api.chatbot.generateProsCons({
        career_name: career,
        course_name: course || undefined,
        context: context || undefined
      });

      setResult(data);
      onGenerated?.(data);
    } catch (err) {
      setError('Failed to generate pros and cons. Please try again.');
      console.error('Error generating pros/cons:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setCareer('');
    setCourse('');
    setContext('');
    setResult(null);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Generate Career Pros & Cons</h3>
          <p className="text-sm text-slate-400">
            Get AI-generated advantages and disadvantages for any career or course
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Career Name *
              </label>
              <Input
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="e.g., Software Engineer, Doctor, Teacher"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Course Name (Optional)
              </label>
              <Input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., Computer Science, Medicine, Education"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Context (Optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any specific context or requirements..."
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={!career.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Pros & Cons'}
              </Button>
              {result && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pros */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold text-green-400">
                ✅ Advantages
              </h4>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span className="text-slate-200">{pro}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Cons */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold text-red-400">
                ❌ Disadvantages
              </h4>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-slate-200">{con}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

