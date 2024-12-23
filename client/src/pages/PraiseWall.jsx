import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/axios';
import PrayerCard from '../components/shared/PrayerCard';
import {useNavigate} from 'react-router-dom'

const PraiseWall = () => {
  const [visibility, setVisibility] = useState(true);
  const [prayerForm, setPrayerForm] = useState({
    email: '',
    phone: '',
    message: '',
    name: '',
    visibility: visibility,
    type: 'praise',
    is_anonymous: false

  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [prayers, setPrayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
}, []);

const fetchDashboardData = async () => {
    try {
      const prayersRes = await api.get("/prayers/approvedPraises");

      // Log the response to ensure you're getting the correct data
      console.log("API Response:", prayersRes.data);

      const fetchedPrayers = prayersRes.data?.data?.prayers;
      setPrayers(Array.isArray(fetchedPrayers) ? fetchedPrayers : []);
    } catch (error) {
        setError('Failed to fetch prayer data');
    }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...prayerForm,
        is_anonymous: !prayerForm.name,
        name: prayerForm.name || 'Anonymous',
        visibility: visibility,
      };
      console.log(submissionData);
      await api.post('/prayers', submissionData);
      setPrayerForm({
        message: '',
        name: '',
        is_anonymous: false
      });
      setSuccess(true);
      setError(null);
      setShowForm(false)
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Prayer submission error:', error);
      setError(error.response?.data?.message || 'Failed to submit prayer request');
    }
  };

  const handleChange = (e) => {
    setPrayerForm({
      ...prayerForm,
      [e.target.name]: e.target.value 
    });
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mt-16 mx-auto p-6">
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

        {!showForm ? (
          <div className='flex flex-col w-full py-4'>
            <div className='flex flex-row'>
            <button
            onClick={() => setShowForm(true)} 
            className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]">
              Submit a Praise
            </button>
            <button
            onClick={() => navigate('/prayerWall')} 
            className="px-3 py-1 py-2 px-4 w-50 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]">
              Prayers
            </button>
            </div>
            
            <div className='flex flex-col gap-4 p-2'>
            {prayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                createdAt={prayer.created_at}
                userName={prayer.name}
                content={prayer.message}
                prayerID={prayer.id}
                type={prayer.type}
              />
            ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={prayerForm.name}
              placeholder='skip for anonymous praise'
              onChange={handleChange}
              className="mt-1 py-1 px-1 block w-full rounded-md bg-white border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={prayerForm.email}
              placeholder='optional'
              onChange={handleChange}
              className="mt-1 py-1 px-1 block w-full bg-white rounded-md border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={prayerForm.phone}
              placeholder='optional'
              onChange={handleChange}
              className="mt-1 py-1 px-1 block w-full bg-white rounded-md border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                Show this on Praise Wall?
            </label>
            <select
                value={visibility}
                onChange={(e) =>setVisibility(e.target.value)}
                className="border bg-white border-gray-300 rounded-md"
            >
                <option value={true}>Yes! Share this on the praise wall</option>
                <option value={0}>No! Do not display this praise</option>
            </select>
            
          </div>

          <div className='flex flex-row'>
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