import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [repoMetrics, setRepoMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/repo/metrics');
        setRepoMetrics(response.data);
      } catch (err) {
        console.error('Error fetching metrics', err);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div>
      <h3>Codebase Metrics</h3>
      {repoMetrics ? (
        <div>
          <h4>Repository: {repoMetrics.repoName}</h4>
          <p>Complexity: {repoMetrics.complexity}</p>
          <p>Anti-Patterns: {repoMetrics.antiPatterns}</p>
          <h5>Top Authors:</h5>
          <ul>
            {repoMetrics.authors.map((author: string, idx: number) => (
              <li key={idx}>{author}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading metrics...</p>
      )}
    </div>
  );
};

export default Dashboard;
