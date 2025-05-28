import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Briefcase, 
  MessageCircle, 
  Building, 
  Search,
  UserRoundCheck,
  Cog,
  Eye,
  Heart,
  Share,
  Clock,
  PlusCircle
} from "lucide-react";

export default function Landing() {
  const userTypes = [
    {
      type: 'job_seeker',
      icon: UserRoundCheck,
      title: 'Job Seeker',
      description: 'Find your next opportunity',
      primary: true
    },
    {
      type: 'recruiter',
      icon: Search,
      title: 'Recruiter',
      description: 'Find top talent',
      primary: false
    },
    {
      type: 'client',
      icon: Building,
      title: 'Client',
      description: 'Showcase your business',
      primary: false
    },
    {
      type: 'admin',
      icon: Cog,
      title: 'Admin',
      description: 'Platform management',
      primary: false
    }
  ];

  const features = [
    {
      title: 'Professional Profiles',
      description: 'Showcase your experience, skills, and achievements with comprehensive professional profiles.',
      points: [
        'Detailed work experience',
        'Skills and endorsements',
        'Education and certifications',
        'Professional recommendations'
      ],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'
    },
    {
      title: 'Smart Job Search',
      description: 'Find your next opportunity with advanced search filters and personalized job recommendations.',
      points: [
        'Advanced search filters',
        'Job alerts and notifications',
        'Easy apply with your profile',
        'Resume ranking system'
      ],
      image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'
    },
    {
      title: 'Professional Networking',
      description: 'Build meaningful professional relationships and expand your network.',
      points: [
        'Connection requests',
        'Direct messaging',
        'Professional groups',
        'Group discussions'
      ],
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'
    }
  ];

  const navigation = [
    { name: 'Home', icon: Home },
    { name: 'Network', icon: Users },
    { name: 'Jobs', icon: Briefcase },
    { name: 'Messaging', icon: MessageCircle },
    { name: 'Companies', icon: Building }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-linkedin-blue">PingJob</h1>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-6">
                  {navigation.map((item) => (
                    <div key={item.name} className="text-gray-600 hover:text-linkedin-blue transition-colors duration-200 flex items-center space-x-1">
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <input 
                  type="text" 
                  placeholder="Search jobs, people, companies..." 
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-linkedin-blue text-white hover:bg-linkedin-dark"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/login'}
                className="border-linkedin-blue text-linkedin-blue hover:bg-linkedin-blue hover:text-white"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Welcome to your professional community
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect with colleagues, discover opportunities, and build your career on PingJob - the platform designed for professionals like you.
              </p>
              
              {/* User Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Join as:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {userTypes.map((userType) => (
                    <button
                      key={userType.type}
                      onClick={() => window.location.href = '/api/login'}
                      className={`p-4 border-2 rounded-lg transition-colors duration-200 ${
                        userType.primary
                          ? 'border-linkedin-blue bg-linkedin-blue text-white hover:bg-linkedin-dark'
                          : 'border-gray-300 hover:border-linkedin-blue'
                      }`}
                    >
                      <userType.icon className={`text-2xl mb-2 mx-auto ${userType.primary ? 'text-white' : 'text-linkedin-blue'}`} />
                      <div className="font-semibold">{userType.title}</div>
                      <div className={`text-sm ${userType.primary ? 'opacity-90' : 'text-gray-600'}`}>
                        {userType.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional team networking and collaborating" 
                className="rounded-xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 bg-bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to advance your career</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From networking to job searching, PingJob provides all the tools professionals need to succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300 job-card">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {feature.points.map((point, pointIndex) => (
                      <li key={pointIndex}>• {point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Job Board Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Discover Your Next Opportunity</h2>
            <p className="text-xl text-gray-600">Browse thousands of job listings from top companies</p>
          </div>

          {/* Job Search Interface Preview */}
          <Card className="shadow-lg p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2">
                <input 
                  type="text" 
                  placeholder="Job title, keywords, or company" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                  disabled
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Location" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                  disabled
                />
              </div>
              <Button className="bg-linkedin-blue text-white hover:bg-linkedin-dark" disabled>
                <Search className="h-4 w-4 mr-2" />
                Search Jobs
              </Button>
            </div>
          </Card>

          {/* Sample Job Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                title: 'Senior Frontend Developer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA • Remote',
                skills: ['React', 'TypeScript', 'Node.js'],
                timePosted: '2 days ago',
                applicants: '47 applicants',
                image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'
              },
              {
                title: 'UX/UI Designer',
                company: 'Design Studio Pro',
                location: 'New York, NY • Hybrid',
                skills: ['Figma', 'Sketch', 'Prototyping'],
                timePosted: '5 days ago',
                applicants: '23 applicants',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'
              },
              {
                title: 'Product Manager',
                company: 'InnovateTech',
                location: 'Austin, TX • On-site',
                skills: ['Strategy', 'Analytics', 'Leadership'],
                timePosted: '1 week ago',
                applicants: '89 applicants',
                image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'
              },
              {
                title: 'Full Stack Engineer',
                company: 'CloudScale Solutions',
                location: 'Seattle, WA • Remote',
                skills: ['Python', 'AWS', 'Docker'],
                timePosted: '3 days ago',
                applicants: '65 applicants',
                image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'
              }
            ].map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 job-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={job.image}
                        alt={`${job.company} office`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                        <p className="text-sm text-gray-500">{job.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="skill-tag">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.timePosted}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.applicants}
                      </span>
                    </div>
                    <Button 
                      className="bg-linkedin-blue text-white hover:bg-linkedin-dark text-sm"
                      onClick={() => window.location.href = '/api/login'}
                    >
                      Easy Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline"
              className="border-linkedin-blue text-linkedin-blue hover:bg-linkedin-blue hover:text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              View All Jobs
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-linkedin-blue">PingJob</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                The professional networking platform designed to connect talent with opportunity.
              </p>
              <div className="flex space-x-4">
                <div className="w-6 h-6 bg-linkedin-blue rounded cursor-pointer hover:bg-white transition-colors duration-200"></div>
                <div className="w-6 h-6 bg-linkedin-blue rounded cursor-pointer hover:bg-white transition-colors duration-200"></div>
                <div className="w-6 h-6 bg-linkedin-blue rounded cursor-pointer hover:bg-white transition-colors duration-200"></div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Job Search</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Networking</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Companies</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Groups</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">For Business</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Recruiter Tools</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Client Pages</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Analytics</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 PingJob. All rights reserved. | Professional networking reimagined.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
