import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/axios";
import PrayerCard from "../components/shared/PrayerCard";
import CategorySelector from "../components/shared/CategorySelector";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToMailchimp } from "../utils/emailSubscribe";
import AuthChoiceModal from "../components/AuthChoiceModal";

const PrayerWall = () => {
  const [visibility, setVisibility] = useState(true);
  const [prayerForm, setPrayerForm] = useState({
    email: "",
    phone: "",
    message: "",
    name: "",
    country: "",
    categories: [],
    visibility: visibility,
    type: "prayer",
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
  const [showFilter, setShowFilter] = useState(false);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mailchimpOptions, setMailchimpOptions] = useState({
    wantEncouragement: false,
    wantUpdates: false,
  });
  const [emailError, setEmailError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const containerRef = useRef(null);

  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log(selectedCategories);
      const prayersRes = await api.get("/prayers/approvedPrayers", {
        params: { page, limit: 10, categories: selectedCategories },
      });

      const fetchedPrayers = prayersRes.data?.data?.prayers || [];
      // console.log(fetchedPrayers);

      if (selectedCategories && selectedCategories.length > 0) {
        setPrayers(fetchedPrayers);
      }
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
      if (selectedCategories.length === 0 && fetchedPrayers.length < 10)
        setHasMore(false);
      // console.log(prayers);
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

  useEffect(() => {
    fetchPrayers();
  }, [selectedCategories]);

  useEffect(() => {
    if (selectedCategories && selectedCategories.length > 0) fetchPrayers();
  }, [selectedCategories]);
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
  // const loadMorePrayers = async () => {
  //   if (loading || !hasMore) return;

  //   setLoading(true);
  //   const nextPage = Math.floor(prayers.length / 10) + 1; // Assuming 10 prayers per page

  //   try {
  //     const prayersRes = await api.get(`/prayers/approvedPrayers`, {
  //       params: { page: nextPage, limit: 10 },
  //     });
  //     const fetchedPrayers = prayersRes.data?.data?.prayers;
  //     console.log(fetchPrayers);
  //     if (fetchedPrayers.length > 0) {
  //       setPrayers((prevPrayers) => [...prevPrayers, ...fetchedPrayers]);
  //     } else {
  //       setHasMore(false);
  //     }
  //   } catch (error) {
  //     setError("Failed to load more prayers");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleMailchimpOptionChange = (e) => {
    const { name, checked } = e.target;
    setMailchimpOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinueAsGuest = () => {
    setShowAuthModal(false);
    setShowForm(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const needsEmail =
      mailchimpOptions.wantEncouragement || mailchimpOptions.wantUpdates;
    // console.log("categories: ",prayerForm.categories);
    if (needsEmail && !prayerForm.email) {
      setEmailError(
        "Email is required when subscribing to updates or encouragement notes"
      );
      return;
    }

    if (needsEmail && !validateEmail(prayerForm.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (prayerForm.name.trim() && !prayerForm.country.trim()) {
      setWarning(true);
      setWarningMessage("Please select your country");
      return;
    }
    try {
      if (needsEmail) {
        try {
          await subscribeToMailchimp(
            prayerForm.email,
            mailchimpOptions.wantEncouragement,
            mailchimpOptions.wantUpdates
          );
        } catch (error) {
          setEmailError(error.message);
          return;
        }
      }
      const submissionData = {
        ...prayerForm,
        is_anonymous: !prayerForm.name,
        name: prayerForm.name || "Anonymous",
        visibility: visibility,
        type: "prayer",
      };
      if (!user) {
        await api.post("/prayers", submissionData);
      } else {
        await api.post("/prayers/authUser", submissionData);
      }

      // console.log("Auth user", user);

      const netlifyData = new FormData();
      netlifyData.append("name", prayerForm.name || "Anonymous");
      netlifyData.append("message", prayerForm.message);
      netlifyData.append("is_anonymous", !prayerForm.name);
      netlifyData.append("visibility", visibility);
      netlifyData.append("type", "prayer");
      netlifyData.append("form-name", "prayer-request"); // Ensure this matches the hidden input

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
          categories: [],
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
          categories: [],
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

  // const handlePrayed = async (prayerId, prayCount) => {
  //   try{
  //       await api.put(`/prayers/${prayerId}/prayCount`, { prayCount });
  //   }catch (error){
  //     setError(error.response?.data?.message || 'Failed to update prayer count');
  //   }

  // }
  // useEffect(() => {
  //   console.log(prayers); // Check for duplicate IDs here
  // }, [prayers]);

  const handlePrayerButtonClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowForm(true);
    }
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
      <div className="max-w-4xl mt-16 2xl:mt-24 mx-auto p-2">
        {/* <h1 className="text-3xl font-bold mb-6">Share Your Prayer Request</h1> */}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Prayer request submitted successfully!
          </div>
        )}
        {warning && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
            {warningMessage}
          </div>
        )}

        {!showForm ? (
          <div className="flex flex-col w-full py-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex  flex-wrap items-center">
                <button
                  onClick={handlePrayerButtonClick}
                  className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
                >
                  Submit a Prayer
                </button>
                <button
                  onClick={() => navigate("/praiseWall")}
                  className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
                >
                  Praises
                </button>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="px-4 py-2 w-40 border border-transparent rounded-xl shadow-md text-sm font-medium bg-green-200 text-green-800 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 ease-in-out"
                >
                  {showFilter ? "Hide Filters" : "Filters"}
                </button>
              </div>
            </div>
            {showFilter && (
              <CategorySelector
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
                mode="filter"
                className="mb-4"
              />
            )}
            
            {prayers.length > 0 ? (
              <div id="prayers-container" className="flex flex-col gap-4 p-2">
              {prayers.map((prayer, index) => (
                <PrayerCard
                  key={`prayer-${index}`}
                  createdAt={prayer.created_at}
                  prayerCount={parseInt(prayer.pray_count, 10)}
                  userName={prayer.name}
                  country={prayer.country}
                  categories={prayer.categories}
                  content={prayer.message}
                  prayerID={prayer.id}
                  type={prayer.type}
                  // parseInt(prayer.pray_count + 1, 10))}
                />
              ))}
            </div>
              ): (<div className="flex text-center flex-1 items-center h-full justify-center"><p className="text-gray-500">No prayers found with current filters</p></div>)}
            
            <AuthChoiceModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onContinueAsGuest={handleContinueAsGuest}
            />
          </div>
        ) : (
          <div className="flex flex-col w-full py-4">
            <form
              name="prayer-request"
              method="POST"
              data-netlify="true"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <input type="hidden" name="form-name" value="prayer-request" />
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
                  placeholder="skip for anonymous prayer"
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
                  {(mailchimpOptions.wantEncouragement ||
                    mailchimpOptions.wantUpdates) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={prayerForm.email}
                  placeholder={
                    mailchimpOptions.wantEncouragement ||
                    mailchimpOptions.wantUpdates
                      ? "Required for subscriptions"
                      : "optional"
                  }
                  onChange={handleChange}
                  className={`mt-1 py-1 px-1 block w-full bg-white rounded-md border-2 
      ${emailError ? "border-red-500" : "border-gray-800"} 
      shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-500">{emailError}</p>
                )}
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

              <CategorySelector
                selectedCategories={prayerForm.categories}
                onChange={(newCategories) =>
                  setPrayerForm((prev) => ({
                    ...prev,
                    categories: newCategories,
                  }))
                }
                mode="form"
                required={true}
              />
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prayer Message
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
                  Show this on Prayer Wall?
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="border bg-white border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select an option</option>
                  <option value={1}>Yes! Share this on the prayer wall</option>
                  <option value={0}>No! Do not display this prayer</option>
                </select>
              </div>
              {/* <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wantEncouragement"
                    name="wantEncouragement"
                    checked={mailchimpOptions.wantEncouragement}
                    onChange={handleMailchimpOptionChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="wantEncouragement"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    I want to receive notes of encouragement
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wantUpdates"
                    name="wantUpdates"
                    checked={mailchimpOptions.wantUpdates}
                    onChange={handleMailchimpOptionChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="wantUpdates"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    I want to receive updates
                  </label>
                </div>
              </div> */}
              <div className="flex flex-row">
                <button
                  type="submit"
                  className="w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
                >
                  Submit Prayer Request
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
          </div>
        )}
      </div>
    </>
  );
};

export default PrayerWall;
