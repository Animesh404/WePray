import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/axios";
import PrayerCard from "../components/shared/PrayerCard";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AuthChoiceModal from "../components/AuthChoiceModal";

const PraiseWall = () => {
  const [visibility, setVisibility] = useState(true);
  const [prayerForm, setPrayerForm] = useState({
    email: "",
    phone: "",
    country: "",
    message: "",
    name: "",
    visibility: visibility,
    type: "praise",
    is_anonymous: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [prayers, setPrayers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const prayersRes = await api.get("/prayers/approvedPraises", {
        params: { page, limit: 10 },
      });

      const fetchedPrayers = prayersRes.data?.data?.prayers || [];
      console.log(fetchedPrayers);

      setPrayers((prevPrayers) => {
        const newPrayers = fetchedPrayers.filter(
          (newPrayer) =>
            !prevPrayers.some(
              (existingPrayer) => existingPrayer.id === newPrayer.id
            )
        );
        return [...prevPrayers, ...newPrayers];
      });

      // If fewer prayers are returned than the limit, we've fetched all pages
      if (fetchedPrayers.length < 10) setHasMore(false);
    } catch (error) {
      console.error("Error fetching prayers:", error);
      setError("Failed to fetch prayers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasMore) fetchPrayers();
  }, [page]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target.documentElement;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prayerForm.name.trim() && !prayerForm.country.trim()) {
      setWarning(true);
      setWarningMessage("Please select your country");
      return;
    }
    try {
      const submissionData = {
        ...prayerForm,
        is_anonymous: !prayerForm.name,
        name: prayerForm.name || "Anonymous",
        visibility: visibility,
        type: "praise",
      };
      console.log(submissionData);
      await api.post("/prayers", submissionData);
      const netlifyData = new FormData();
      netlifyData.append("name", prayerForm.name || "Anonymous");
      netlifyData.append("message", prayerForm.message);
      netlifyData.append("is_anonymous", !prayerForm.name);
      netlifyData.append("visibility", visibility);
      netlifyData.append("type", "praise");
      netlifyData.append("form-name", "praise-request"); // Ensure this matches the hidden input

      const response = await fetch("/", {
        method: "POST",
        body: new URLSearchParams(netlifyData).toString(),
      });
      if (response.ok) {
        // Reset the form and set success state
        setPrayerForm({
          message: "",
          name: "",
          is_anonymous: false,
        });
        setSuccess(true);
        setError(null);
        setWarning(false);
        setShowForm(false);
        console.log("admin was notified");

        setTimeout(() => setSuccess(false), 3000);
      } else {
        // throw new Error('Failed to submit prayer request to Netlify');
        setPrayerForm({
          message: "",
          name: "",
          is_anonymous: false,
        });
        setSuccess(true);
        setError(null);
        setWarning(false);
        setShowForm(false);

        setTimeout(() => setSuccess(false), 3000);
        console.log("admin was not notified");
      }
    } catch (error) {
      console.error("Prayer submission error:", error);
      setError(
        error.response?.data?.message || "Failed to submit prayer request"
      );
    }
  };

  const handlePraiseButtonClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowForm(true);
    }
  };

  const handleContinueAsGuest = () => {
    setShowAuthModal(false);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setPrayerForm({
      ...prayerForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mt-16 2xl:mt-24 mx-auto p-6">
        {/* <h1 className="text-3xl font-bold mb-6">Share Your Prayer Request</h1> */}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Praise request submitted successfully!
          </div>
        )}
        {warning && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
            {warningMessage}
          </div>
        )}

        {!showForm ? (
          <div className="flex flex-col w-full py-4">
            <div className="flex flex-row">
              <button
                onClick={handlePraiseButtonClick}
                className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
              >
                Submit a Praise
              </button>
              <button
                onClick={() => navigate("/prayerWall")}
                className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
              >
                Prayers
              </button>
            </div>

            <div id="prayers-container" className="flex flex-col gap-4 p-2">
              {prayers.map((prayer, index) => (
                <PrayerCard
                  key={`prayer-${index}`}
                  createdAt={prayer.created_at}
                  userName={prayer.name}
                  country={prayer.country}
                  content={prayer.message}
                  prayerID={prayer.id}
                  type={prayer.type}
                />
              ))}
            </div>
            <AuthChoiceModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onContinueAsGuest={handleContinueAsGuest}
            />
          </div>
        ) : (
          <form
            name="praise-request"
            method="POST"
            data-netlify="true"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <input type="hidden" name="form-name" value="praise-request" />
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={prayerForm.name}
                placeholder="skip for anonymous praise"
                onChange={handleChange}
                className="mt-1 py-1 px-1 block w-full rounded-md bg-white border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700"
              >
                Your Country
              </label>
              <select
                id="country"
                name="country"
                value={prayerForm.country}
                onChange={handleChange}
                className="mt-1 py-1 px-1 block w-full rounded-md bg-white border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select your country</option>
                {[
                  "Afghanistan",
                  "Albania",
                  "Algeria",
                  "Andorra",
                  "Angola",
                  "Antigua and Barbuda",
                  "Argentina",
                  "Armenia",
                  "Australia",
                  "Austria",
                  "Azerbaijan",
                  "Bahamas",
                  "Bahrain",
                  "Bangladesh",
                  "Barbados",
                  "Belarus",
                  "Belgium",
                  "Belize",
                  "Benin",
                  "Bhutan",
                  "Bolivia",
                  "Bosnia and Herzegovina",
                  "Botswana",
                  "Brazil",
                  "Brunei",
                  "Bulgaria",
                  "Burkina Faso",
                  "Burundi",
                  "Cabo Verde",
                  "Cambodia",
                  "Cameroon",
                  "Canada",
                  "Central African Republic",
                  "Chad",
                  "Chile",
                  "China",
                  "Colombia",
                  "Comoros",
                  "Congo",
                  "Costa Rica",
                  "Croatia",
                  "Cuba",
                  "Cyprus",
                  "Czech Republic",
                  "Denmark",
                  "Djibouti",
                  "Dominica",
                  "Dominican Republic",
                  "Ecuador",
                  "Egypt",
                  "El Salvador",
                  "Equatorial Guinea",
                  "Eritrea",
                  "Estonia",
                  "Eswatini",
                  "Ethiopia",
                  "Fiji",
                  "Finland",
                  "France",
                  "Gabon",
                  "Gambia",
                  "Georgia",
                  "Germany",
                  "Ghana",
                  "Greece",
                  "Grenada",
                  "Guatemala",
                  "Guinea",
                  "Guinea-Bissau",
                  "Guyana",
                  "Haiti",
                  "Honduras",
                  "Hungary",
                  "Iceland",
                  "India",
                  "Indonesia",
                  "Iran",
                  "Iraq",
                  "Ireland",
                  "Israel",
                  "Italy",
                  "Jamaica",
                  "Japan",
                  "Jordan",
                  "Kazakhstan",
                  "Kenya",
                  "Kiribati",
                  "Kuwait",
                  "Kyrgyzstan",
                  "Laos",
                  "Latvia",
                  "Lebanon",
                  "Lesotho",
                  "Liberia",
                  "Libya",
                  "Liechtenstein",
                  "Lithuania",
                  "Luxembourg",
                  "Madagascar",
                  "Malawi",
                  "Malaysia",
                  "Maldives",
                  "Mali",
                  "Malta",
                  "Marshall Islands",
                  "Mauritania",
                  "Mauritius",
                  "Mexico",
                  "Micronesia",
                  "Moldova",
                  "Monaco",
                  "Mongolia",
                  "Montenegro",
                  "Morocco",
                  "Mozambique",
                  "Myanmar",
                  "Namibia",
                  "Nauru",
                  "Nepal",
                  "Netherlands",
                  "New Zealand",
                  "Nicaragua",
                  "Niger",
                  "Nigeria",
                  "North Korea",
                  "North Macedonia",
                  "Norway",
                  "Oman",
                  "Pakistan",
                  "Palau",
                  "Palestine",
                  "Panama",
                  "Papua New Guinea",
                  "Paraguay",
                  "Peru",
                  "Philippines",
                  "Poland",
                  "Portugal",
                  "Qatar",
                  "Romania",
                  "Russia",
                  "Rwanda",
                  "Saint Kitts and Nevis",
                  "Saint Lucia",
                  "Saint Vincent and the Grenadines",
                  "Samoa",
                  "San Marino",
                  "Sao Tome and Principe",
                  "Saudi Arabia",
                  "Senegal",
                  "Serbia",
                  "Seychelles",
                  "Sierra Leone",
                  "Singapore",
                  "Slovakia",
                  "Slovenia",
                  "Solomon Islands",
                  "Somalia",
                  "South Africa",
                  "South Korea",
                  "South Sudan",
                  "Spain",
                  "Sri Lanka",
                  "Sudan",
                  "Suriname",
                  "Sweden",
                  "Switzerland",
                  "Syria",
                  "Taiwan",
                  "Tajikistan",
                  "Tanzania",
                  "Thailand",
                  "Timor-Leste",
                  "Togo",
                  "Tonga",
                  "Trinidad and Tobago",
                  "Tunisia",
                  "Turkey",
                  "Turkmenistan",
                  "Tuvalu",
                  "Uganda",
                  "Ukraine",
                  "United Arab Emirates",
                  "United Kingdom",
                  "United States",
                  "Uruguay",
                  "Uzbekistan",
                  "Vanuatu",
                  "Vatican City",
                  "Venezuela",
                  "Vietnam",
                  "Yemen",
                  "Zambia",
                  "Zimbabwe",
                ].map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={prayerForm.email}
                placeholder="optional"
                onChange={handleChange}
                className="mt-1 py-1 px-1 block w-full bg-white rounded-md border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={prayerForm.phone}
                placeholder="optional"
                onChange={handleChange}
                className="mt-1 py-1 px-1 block w-full bg-white rounded-md border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
              >
                Praise Message
              </label>
              <textarea
                id="message"
                name="message"
                value={prayerForm.message}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block py-1 px-1 w-full bg-white rounded-md border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="visibility"
                className="block text-sm font-medium text-gray-700"
              >
                Show this on Praise Wall?
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="border bg-white border-gray-300 rounded-md"
                required
              >
                <option value="">Select an option</option>
                <option value={1}>Yes! Share this on the praise wall</option>
                <option value={0}>No! Do not display this praise</option>
              </select>
            </div>

            <div className="flex flex-row">
              <button
                type="submit"
                className="w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
              >
                Submit Praise Request
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
              >
                cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default PraiseWall;
