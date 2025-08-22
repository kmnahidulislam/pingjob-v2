import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";
import { Building, X, Upload } from "lucide-react";

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

export default function CompanyCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Location data queries
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error('Failed to fetch countries');
      return response.json();
    }
  });

  const { data: states } = useQuery({
    queryKey: ['/api/states', selectedCountryId],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/states/${selectedCountryId}`);
      if (!response.ok) throw new Error('Failed to fetch states');
      return response.json();
    },
    enabled: !!selectedCountryId
  });

  const { data: cities } = useQuery({
    queryKey: ['/api/cities', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const response = await fetch(`/api/cities/${selectedStateId}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: !!selectedStateId
  });

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      location: "",
      industry: "",
      size: "1-10",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: z.infer<typeof companyFormSchema>) => {
      if (import.meta.env.DEV) console.log("=== FRONTEND COMPANY CREATION START ===");
      if (import.meta.env.DEV) console.log("Company data:", companyData);
      if (import.meta.env.DEV) console.log("Logo file:", logoFile);
      if (import.meta.env.DEV) console.log("User:", user);
      
      let logoUrl = "";
      
      // Upload logo first if one is selected
      if (logoFile) {
        if (import.meta.env.DEV) console.log("Uploading logo file...");
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        if (import.meta.env.DEV) console.log("Making logo upload request to /api/upload/company-logo");
        const logoResponse = await fetch('/api/upload/company-logo', {
          method: 'POST',
          body: formData,
        });
        
        if (import.meta.env.DEV) console.log("Logo upload response status:", logoResponse.status);
        
        if (logoResponse.ok) {
          const logoResult = await logoResponse.json();
          if (import.meta.env.DEV) console.log("Logo upload result:", logoResult);
          logoUrl = logoResult.logoUrl;
        } else {
          const errorText = await logoResponse.text();
          console.error("Logo upload failed:", errorText);
          throw new Error(`Failed to upload logo: ${errorText}`);
        }
      }
      
      // Get selected country and state names from the UI
      const selectedCountry = countries?.find((c: any) => c.id === selectedCountryId);
      const selectedState = states?.find((s: any) => s.id === selectedStateId);
      
      // Create company with logo URL and userId
      const finalCompanyData = {
        ...companyData,
        userId: user?.id || 'admin',
        logoUrl,
        country: selectedCountry?.name || companyData.country,
        state: selectedState?.name || companyData.state,
        countryId: selectedCountryId // For backend compatibility
      };
      
      if (import.meta.env.DEV) console.log("Creating company with data:", finalCompanyData);
      if (import.meta.env.DEV) console.log("Making company creation request to /api/companies");
      
      const response = await apiRequest('POST', '/api/companies', finalCompanyData);
      
      if (import.meta.env.DEV) console.log("Company creation response:", response);
      if (import.meta.env.DEV) console.log("Response status:", response.status);
      if (import.meta.env.DEV) console.log("Response ok:", response.ok);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Parse JSON safely
      let result;
      try {
        result = await response.json();
        if (import.meta.env.DEV) console.log("Company creation result:", result);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid server response format");
      }
      
      return result;
    },
    onSuccess: () => {
      // Show different messages based on user type
      const isPayingUser = user?.userType === 'recruiter' || user?.userType === 'client';
      
      toast({
        title: "Company created successfully",
        description: isPayingUser 
          ? "Your company has been approved and you can start posting jobs immediately"
          : "Your company has been submitted for approval"
      });
      companyForm.reset();
      setLogoFile(null);
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error: any) => {
      console.error("=== COMPANY CREATION ERROR ===");
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error stack:", error.stack);
      
      // Show user-friendly error based on the actual error
      let errorMessage = "Failed to create company";
      
      if (error.message) {
        // If it's a network or parsing error, show that
        if (error.message.includes("JSON") || error.message.includes("Invalid server response")) {
          errorMessage = "Server response error - please try again";
        } else if (error.message.includes("401")) {
          errorMessage = "Please log in again";
        } else if (error.message.includes("403")) {
          errorMessage = "You don't have permission to create companies";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error - please try again later";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error creating company",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG, PNG, or GIF image",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 2MB",
          variant: "destructive"
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (data: z.infer<typeof companyFormSchema>) => {
    console.log("=== COMPANY FORM SUBMISSION ===");
    console.log("Form submitted with data:", data);
    console.log("Form errors:", companyForm.formState.errors);
    console.log("Form is valid:", companyForm.formState.isValid);
    console.log("Logo file:", logoFile);
    console.log("Mutation is pending:", createCompanyMutation.isPending);
    
    // Check for validation errors
    const errors = companyForm.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.log("VALIDATION FAILED - Errors:", errors);
      toast({
        title: "Validation Error",
        description: `Please check required fields: ${Object.keys(errors).join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    // Prevent double submission
    if (createCompanyMutation.isPending) {
      console.log("MUTATION ALREADY PENDING - Preventing double submission");
      return;
    }
    
    console.log("VALIDATION PASSED - Calling mutation");
    createCompanyMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to create a company.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              Create Company Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <FormLabel>Company Logo</FormLabel>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, or GIF (max 2MB)</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your company..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const countryObj = countries?.find((c: any) => c.name === value);
                            if (countryObj) {
                              setSelectedCountryId(countryObj.id);
                              setSelectedStateId(null);
                              companyForm.setValue('state', '');
                              companyForm.setValue('city', '');
                            }
                            field.onChange(value);
                          }} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries?.map((country: any) => (
                              <SelectItem key={country.id} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const stateObj = states?.find((s: any) => s.name === value);
                            if (stateObj) {
                              setSelectedStateId(stateObj.id);
                              companyForm.setValue('city', '');
                            }
                            field.onChange(value);
                          }} 
                          value={field.value || ""}
                          disabled={!selectedCountryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states?.map((state: any) => (
                              <SelectItem key={state.id} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                          disabled={!selectedStateId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities?.map((city: any) => (
                              <SelectItem key={city.id} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 Main Street, Suite 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="501-1000">501-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createCompanyMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}