import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import CreateProfileModal from "@/components/modals/create-profile-modal";
import { SocialMediaLinks } from "@/components/social-media-links";
import {
  Plus,
  Edit,
  MapPin,
  Calendar,
  Building,
  Award,
  BookOpen,
  Users,
  MessageCircle,
  UserPlus,
  Check,
  Mail,
  Briefcase
} from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newExperience, setNewExperience] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' });
  const [newSkill, setNewSkill] = useState({ name: '' });

  const profileId = id || user?.id;
  const isOwnProfile = !id || id === user?.id;

  const { data: profile = {}, isLoading, error } = useQuery({
    queryKey: [`/api/profile/${profileId}`],
    enabled: !!profileId
  });

  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const connectionMutation = useMutation({
    mutationFn: () => 
      fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: profileId }),
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send connection request');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to ${profile?.firstName} ${profile?.lastName}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    }
  });

  // Mutations for adding profile sections
  const addExperienceMutation = useMutation({
    mutationFn: async (experienceData: any) => {
      const res = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experienceData),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to add experience');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Experience added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/profile/${profileId}`] });
      setShowExperienceForm(false);
      setNewExperience({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add experience",
        variant: "destructive"
      });
    }
  });

  const addEducationMutation = useMutation({
    mutationFn: async (educationData: any) => {
      const res = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(educationData),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to add education');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Education added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/profile/${profileId}`] });
      setShowEducationForm(false);
      setNewEducation({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add education",
        variant: "destructive"
      });
    }
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skillData: any) => {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to add skill');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Skill added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/profile/${profileId}`] });
      setShowSkillForm(false);
      setNewSkill({ name: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill",
        variant: "destructive"
      });
    }
  });

  // Check if users are connected
  const isConnected = connections?.some((conn: any) => 
    (conn.requester?.id === profileId || conn.receiver?.id === profileId) && 
    conn.status === 'accepted'
  );

  useEffect(() => {
    if (isOwnProfile && user && !profile && !isLoading && !error) {
      setShowCreateModal(true);
    }
  }, [isOwnProfile, user, profile, isLoading, error]);

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let completion = 20; // Base score
    
    if (profile.headline) completion += 15;
    if (profile.summary) completion += 15;
    if (profile.location) completion += 10;
    if (profile.experiences?.length > 0) completion += 20;
    if (profile.education?.length > 0) completion += 10;
    if (profile.skills?.length > 0) completion += 10;
    
    return Math.min(completion, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linkedin-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
              <p className="text-gray-600">
                {isOwnProfile ? "Complete your profile to get started" : "This profile doesn't exist"}
              </p>
              {isOwnProfile && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-linkedin-blue hover:bg-linkedin-dark"
                >
                  Create Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-linkedin-blue to-linkedin-light"></div>
            <CardContent className="p-6 -mt-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-linkedin-blue text-white text-3xl">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">
                    {profile.headline || 'Professional'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.industry && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{profile.industry}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {isOwnProfile ? (
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      {isConnected ? (
                        <Button variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      ) : (
                        <Button
                          onClick={() => connectionMutation.mutate()}
                          disabled={connectionMutation.isPending}
                          className="bg-linkedin-blue hover:bg-linkedin-dark"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {profile.summary && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Experience
              </CardTitle>
              {isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={() => setShowExperienceForm(!showExperienceForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {showExperienceForm && isOwnProfile && (
                <div className="mb-4 p-4 border rounded">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Job Title *</label>
                      <input
                        type="text"
                        value={newExperience.title}
                        onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                        placeholder="e.g. Software Engineer"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Company *</label>
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        placeholder="e.g. Google"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        value={newExperience.location}
                        onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Date *</label>
                      <input
                        type="date"
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="date"
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                        disabled={newExperience.isCurrent}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isCurrent"
                        checked={newExperience.isCurrent}
                        onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked, endDate: e.target.checked ? '' : newExperience.endDate })}
                        className="mr-2"
                      />
                      <label htmlFor="isCurrent" className="text-sm font-medium">I currently work here</label>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={newExperience.description}
                        onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                        placeholder="Describe your role and achievements..."
                        rows={3}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addExperienceMutation.mutate(newExperience)}
                        disabled={!newExperience.title.trim() || !newExperience.company.trim() || !newExperience.startDate || addExperienceMutation.isPending}
                      >
                        {addExperienceMutation.isPending ? 'Adding...' : 'Add Experience'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowExperienceForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp: any) => (
                  <div key={exp.id} className="border-l-2 border-linkedin-blue pl-4">
                    <h3 className="font-semibold text-lg">{exp.title}</h3>
                    <p className="text-linkedin-blue font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                      {exp.isCurrent ? ' Present' : ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                    </p>
                    {exp.description && (
                      <p className="text-gray-700 text-sm">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {isOwnProfile ? "Add your work experience to showcase your professional journey" : "No experience listed"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Education
              </CardTitle>
              {isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={() => setShowEducationForm(!showEducationForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {showEducationForm && isOwnProfile && (
                <div className="mb-4 p-4 border rounded">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Institution *</label>
                      <input
                        type="text"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        placeholder="e.g. Harvard University"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Degree *</label>
                      <input
                        type="text"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        placeholder="e.g. Bachelor of Science"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Field of Study</label>
                      <input
                        type="text"
                        value={newEducation.fieldOfStudy}
                        onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
                        placeholder="e.g. Computer Science"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Grade/GPA</label>
                      <input
                        type="text"
                        value={newEducation.grade}
                        onChange={(e) => setNewEducation({ ...newEducation, grade: e.target.value })}
                        placeholder="e.g. 3.8/4.0"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Date *</label>
                      <input
                        type="date"
                        value={newEducation.startDate}
                        onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="date"
                        value={newEducation.endDate}
                        onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={newEducation.description}
                        onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                        placeholder="Additional details about your education..."
                        rows={2}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addEducationMutation.mutate(newEducation)}
                        disabled={!newEducation.institution.trim() || !newEducation.degree.trim() || !newEducation.startDate || addEducationMutation.isPending}
                      >
                        {addEducationMutation.isPending ? 'Adding...' : 'Add Education'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowEducationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {profile.education && profile.education.length > 0 ? (
                profile.education.map((edu: any) => (
                  <div key={edu.id} className="border-l-2 border-success-green pl-4">
                    <h3 className="font-semibold text-lg">{edu.institution}</h3>
                    <p className="text-success-green font-medium">{edu.degree}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-gray-600">{edu.fieldOfStudy}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {isOwnProfile ? "Add your educational background" : "No education listed"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Skills
              </CardTitle>
              {isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={() => setShowSkillForm(!showSkillForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showSkillForm && isOwnProfile && (
                <div className="mb-4 p-4 border rounded">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Skill Name</label>
                      <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        placeholder="e.g. React, JavaScript, Project Management"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addSkillMutation.mutate(newSkill)}
                        disabled={!newSkill.name.trim() || addSkillMutation.isPending}
                      >
                        {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowSkillForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary" className="skill-tag">
                      {skill.name}
                      {skill.endorsements > 0 && (
                        <span className="ml-1 text-xs">({skill.endorsements})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {isOwnProfile ? "Add skills to showcase your expertise" : "No skills listed"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <SocialMediaLinks
            userId={profileId || ''}
            facebookUrl={profile.facebookUrl || ''}
            twitterUrl={profile.twitterUrl || ''}
            instagramUrl={profile.instagramUrl || ''}
            editable={isOwnProfile}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion (Own Profile Only) */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Strength</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completeness</span>
                    <span className="font-semibold">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="progress-bar" />
                </div>
                
                <div className="space-y-2 text-sm">
                  {profileCompletion < 100 && (
                    <div>
                      <p className="font-medium mb-2">Complete your profile:</p>
                      <ul className="text-gray-600 space-y-1">
                        {!profile.headline && <li>• Add a professional headline</li>}
                        {!profile.summary && <li>• Write an about section</li>}
                        {!profile.location && <li>• Add your location</li>}
                        {(!profile.experiences || profile.experiences.length === 0) && <li>• Add work experience</li>}
                        {(!profile.education || profile.education.length === 0) && <li>• Add education</li>}
                        {(!profile.skills || profile.skills.length === 0) && <li>• Add skills</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile views</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connections</span>
                <span className="font-semibold">{connections?.length || 0}</span>
              </div>
              {profile.experiences && profile.experiences.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="font-semibold">{profile.experiences.length} roles</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          {!isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Send a message to connect</span>
                </div>
                {profile.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">{profile.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateProfileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
        }}
      />
    </div>
  );
}
