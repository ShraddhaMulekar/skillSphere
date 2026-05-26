import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../api/userApi";
import { updateUser } from "../store/authSlice";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Loader from "../components/ui/Loader";
import SecuritySettings from "../components/security/SecuritySettings";

const emptyProfile = {
  name: "",
  phone: "",
  bio: "",
  location: "",
  avatar: "",
  companyName: "",
  hourlyRate: 0,
  milestoneRate: 0,
  skills: [],
  experience: [],
  certifications: [],
  portfolio: [],
  resume: "",
  availability: {},
};

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState({ name: "", level: "intermediate" });
  const [expInput, setExpInput] = useState({ company: "", title: "", duration: "", description: "" });
  const [certInput, setCertInput] = useState("");
  const [portInput, setPortInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfile();
      return res.data.user;
    },
  });

  const profile = {
    ...emptyProfile,
    ...(data || {}),
    ...form,
    availability: {
      ...(data?.availability || {}),
      ...(form.availability || {}),
    },
  };

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      dispatch(updateUser(res.data.user));
      setMessage("Profile saved successfully!");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to update profile");
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const addSkill = () => {
    if (!skillInput.name.trim()) return;
    setForm({
      ...form,
      skills: [...(profile.skills || []), { ...skillInput }],
    });
    setSkillInput({ name: "", level: "intermediate" });
  };

  const removeSkill = (index) => {
    setForm({
      ...form,
      skills: profile.skills.filter((_, i) => i !== index),
    });
  };

  const addExperience = () => {
    if (!expInput.company || !expInput.title) return;
    setForm({
      ...form,
      experience: [...(profile.experience || []), { ...expInput }],
    });
    setExpInput({ company: "", title: "", duration: "", description: "" });
  };

  const removeExperience = (index) => {
    setForm({
      ...form,
      experience: profile.experience.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    if (!certInput.trim()) return;
    setForm({
      ...form,
      certifications: [...(profile.certifications || []), certInput.trim()],
    });
    setCertInput("");
  };

  const removeCertification = (index) => {
    setForm({
      ...form,
      certifications: profile.certifications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...profile,
      hourlyRate: Number(profile.hourlyRate),
      milestoneRate: Number(profile.milestoneRate),
    });
  };

  if (isLoading) return <Loader text="Loading profile..." />;

  const isFreelancer = user?.role === "freelancer";
  const isClient = user?.role === "client";

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Edit Profile</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 capitalize">
          {user?.role} account settings
        </p>

        <Alert type="success" message={message} />
        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <ProfileField
            label="Full Name"
            name="name"
            value={profile.name}
            onChange={handleChange}
          />
          <ProfileField
            label="Phone"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
          />
          <ProfileField
            label="Location"
            name="location"
            value={profile.location}
            onChange={handleChange}
            placeholder="City, State"
          />
          <ProfileField
            label="Avatar URL"
            name="avatar"
            value={profile.avatar}
            onChange={handleChange}
            placeholder="https://..."
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Account Role (Switch to test other views like Admin)
            </label>
            <select
              name="role"
              value={profile.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[80px]"
              placeholder="Tell others about yourself..."
            />
          </div>

          {isClient && (
            <ProfileField
              label="Company Name"
              name="companyName"
              value={profile.companyName}
              onChange={handleChange}
            />
          )}

          {isFreelancer && (
            <>
              <ProfileField
                label="Hourly Rate (INR)"
                name="hourlyRate"
                type="number"
                value={profile.hourlyRate}
                onChange={handleChange}
              />
              <ProfileField
                label="Typical Milestone Price (INR)"
                name="milestoneRate"
                type="number"
                value={profile.milestoneRate}
                onChange={handleChange}
              />
              <ProfileField
                label="Resume URL"
                name="resume"
                value={profile.resume}
                onChange={handleChange}
                placeholder="https://..."
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Skills
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    value={skillInput.name}
                    onChange={(e) =>
                      setSkillInput({ ...skillInput, name: e.target.value })
                    }
                    placeholder="Skill name"
                    className="flex-1 min-w-0 px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={skillInput.level}
                      onChange={(e) =>
                        setSkillInput({ ...skillInput, level: e.target.value })
                      }
                      className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <Button
                      type="button"
                      onClick={addSkill}
                      className="shrink-0 px-4 sm:px-6"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-sm flex items-center gap-2 border border-indigo-500/50"
                    >
                      {skill.name} ({skill.level})
                      <button
                        type="button"
                        onClick={() => removeSkill(i)}
                        className="hover:text-red-300 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-lg font-bold text-white mb-4">
                  Work Experience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="Company"
                    value={expInput.company}
                    onChange={(e) => setExpInput({ ...expInput, company: e.target.value })}
                    className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <input
                    placeholder="Title"
                    value={expInput.title}
                    onChange={(e) => setExpInput({ ...expInput, title: e.target.value })}
                    className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <input
                    placeholder="Duration (e.g. 2020 - 2022)"
                    value={expInput.duration}
                    onChange={(e) => setExpInput({ ...expInput, duration: e.target.value })}
                    className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <input
                    placeholder="Short description"
                    value={expInput.description}
                    onChange={(e) => setExpInput({ ...expInput, description: e.target.value })}
                    className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <Button type="button" onClick={addExperience} variant="secondary">
                    Add Experience
                  </Button>
                </div>
                <div className="space-y-3">
                  {(profile.experience || []).map((exp, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 relative">
                      <button
                        type="button"
                        onClick={() => removeExperience(i)}
                        className="absolute top-2 right-2 text-white/30 hover:text-red-400"
                      >
                        ✕
                      </button>
                      <p className="font-bold text-white text-sm">{exp.title} @ {exp.company}</p>
                      <p className="text-slate-400 text-xs">{exp.duration}</p>
                      {exp.description && (
                        <p className="text-slate-300 text-xs mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-lg font-bold text-white mb-4">
                  Certifications
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    placeholder="Certification Name"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <Button type="button" onClick={addCertification}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(profile.certifications || []).length > 0 ? (
                    profile.certifications.map((cert, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-cyan-500/30 text-cyan-200 text-sm flex items-center gap-2 border border-cyan-500/50">
                        {cert}
                        <button type="button" onClick={() => removeCertification(i)} className="hover:text-red-300">×</button>
                      </span>
                    ))
                  ) : (
                    <p className="text-white/30 text-xs italic">No certifications added yet.</p>
                  )}
                </div>
              </div>

              {/* Portfolio */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-lg font-bold text-white mb-4">
                  Portfolio Projects
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    placeholder="Project URL"
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
                  />
                  <Button type="button" onClick={() => {
                    if (!portInput.trim()) return;
                    setForm({...form, portfolio: [...(profile.portfolio || []), portInput.trim()]});
                    setPortInput("");
                  }}>Add</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(profile.portfolio || []).map((url, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                      <span className="text-xs truncate flex-1 text-slate-300">{url}</span>
                      <button
                        type="button"
                        onClick={() => setForm({...form, portfolio: profile.portfolio.filter((_, idx) => idx !== i)})}
                        className="text-red-400 hover:text-red-300 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-lg font-bold text-white mb-4">
                  Weekly Availability
                </label>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <div key={day} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <span className="w-24 text-sm text-slate-300 font-medium">{day}</span>
                      <input
                        placeholder="e.g. 09:00 - 17:00"
                        value={profile.availability?.[day] || ""}
                        onChange={(e) => setForm({
                          ...form, 
                          availability: { ...profile.availability, [day]: e.target.value }
                        })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="mt-4 w-full sm:w-auto"
          >
            {mutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        <SecuritySettings />
      </div>
    </div>
  );
}

function ProfileField({ label, name, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  );
}
