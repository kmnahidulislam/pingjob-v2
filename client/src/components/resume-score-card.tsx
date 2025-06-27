import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, Trophy, Target, GraduationCap, Briefcase } from "lucide-react";

interface ResumeScoreCardProps {
  application: {
    id: number;
    matchScore: number;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    isProcessed: boolean;
    processingError?: string;
    job?: {
      title: string;
      company?: {
        name: string;
      };
    };
  };
}

export default function ResumeScoreCard({ application }: ResumeScoreCardProps) {
  const { matchScore, skillsScore, experienceScore, educationScore, isProcessed, processingError } = application;

  if (!isProcessed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Resume Analysis Pending
          </CardTitle>
          <CardDescription>
            Your resume is being analyzed. This usually takes a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Processing resume...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processingError) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Analysis Failed
          </CardTitle>
          <CardDescription className="text-red-500">
            {processingError}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please try uploading your resume again or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    if (score >= 4) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent Match";
    if (score >= 6) return "Good Match";
    if (score >= 4) return "Fair Match";
    return "Needs Improvement";
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          Resume Match Score
          {application.job && (
            <div className="ml-auto text-sm font-normal text-gray-600">
              {application.job.title}
              {application.job.company && ` at ${application.job.company.name}`}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          How well your resume matches this job requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(matchScore)}`}>
              {matchScore}/10
            </div>
            <div>
              <Badge variant="secondary" className={getScoreColor(matchScore)}>
                {getScoreLabel(matchScore)}
              </Badge>
            </div>
          </div>
          <Progress 
            value={matchScore * 10} 
            className="w-full h-3"
            style={{ 
              background: `linear-gradient(to right, ${getProgressColor(matchScore)} 0%, ${getProgressColor(matchScore)} ${matchScore * 10}%, #e5e7eb ${matchScore * 10}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Skills Score */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{skillsScore}/4</div>
            <div className="text-sm text-gray-600">Skills Match</div>
            <Progress value={(skillsScore / 4) * 100} className="mt-2 h-2" />
          </div>

          {/* Experience Score */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Briefcase className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{experienceScore}/3</div>
            <div className="text-sm text-gray-600">Experience</div>
            <Progress value={(experienceScore / 3) * 100} className="mt-2 h-2" />
          </div>

          {/* Education Score */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <GraduationCap className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{educationScore}/3</div>
            <div className="text-sm text-gray-600">Education</div>
            <Progress value={(educationScore / 3) * 100} className="mt-2 h-2" />
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Recommendations
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {skillsScore < 3 && (
              <li>• Consider highlighting more relevant technical skills</li>
            )}
            {experienceScore < 2 && (
              <li>• Emphasize your relevant work experience and achievements</li>
            )}
            {educationScore < 2 && (
              <li>• Include relevant certifications or educational background</li>
            )}
            {matchScore >= 7 && (
              <li>• Great match! Your profile aligns well with this position</li>
            )}
            {matchScore < 5 && (
              <li>• Consider tailoring your resume to better match job requirements</li>
            )}
          </ul>
        </div>

        {/* Qualification Status */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-50">
          {matchScore >= 5 ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">
                Qualified - Resume meets minimum requirements
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-700">
                Below threshold - Consider improving your resume
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}