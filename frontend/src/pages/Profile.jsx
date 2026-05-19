import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../api/userApi";
import { updateUser } from "../store/authSlice";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Loader from "../components/ui/Loader";
import SecuritySettings from "../components/security/SecuritySettings";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState({ name: "", level: "intermediate" });

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfile();
      return res.data.user;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        bio: data.bio || "",
        location: data.location || "",
        companyName: data.companyName || "",
        hourlyRate: data.hourlyRate || 0,
        skills: data.skills || [],
      });
    }
  }, [data]);

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
      skills: [...(form.skills || []), { ...skillInput }],
    });
    setSkillInput({ name: "", level: "intermediate" });
  };

  const removeSkill = (index) => {
    setForm({
      ...form,
      skills: form.skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      hourlyRate: Number(form.hourlyRate),
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
            value={form.name}
            onChange={handleChange}
          />
          <ProfileField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          <ProfileField
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="City, State"
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              value={form.bio}
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
              value={form.companyName}
              onChange={handleChange}
            />
          )}

          {isFreelancer && (
            <>
              <ProfileField
                label="Hourly Rate (₹)"
                name="hourlyRate"
                type="number"
                value={form.hourlyRate}
                onChange={handleChange}
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
                    className="flex-1 min-w-0 px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm sm:text-base"
                  />
                  <div className="flex gap-2">
                    <select
                      value={skillInput.level}
                      onChange={(e) =>
                        setSkillInput({ ...skillInput, level: e.target.value })
                      }
                      className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm"
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
                  {(form.skills || []).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-sm flex items-center gap-2"
                    >
                      {skill.name} ({skill.level})
                      <button
                        type="button"
                        onClick={() => removeSkill(i)}
                        className="hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
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
