// Quick test script to debug Jira API
const axios = require('axios');

const JIRA_URL = 'https://uworxltd.atlassian.net';
const JIRA_EMAIL = 'muhammad.shahbaz@uworx.co.uk';
const JIRA_TOKEN = process.env.JIRA_TOKEN || 'YOUR_TOKEN_HERE';

async function testJira() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  
  const queries = [
    // Test 1: Very broad query
    `assignee = currentUser() ORDER BY updated DESC`,
    // Test 2: Last 7 days
    `assignee = currentUser() AND updated >= ${sevenDaysAgoStr} ORDER BY updated DESC`,
    // Test 3: Include subtasks explicitly
    `assignee = currentUser() AND (issuetype = Sub-task OR issuetype != Sub-task) AND updated >= ${sevenDaysAgoStr} ORDER BY updated DESC`,
    // Test 4: NEW - Include previously assigned issues (THIS IS THE FIX!)
    `(assignee = currentUser() OR assignee was currentUser() OR comment ~ currentUser()) AND updated >= ${sevenDaysAgoStr} ORDER BY updated DESC`,
  ];

  for (let i = 0; i < queries.length; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}: ${queries[i]}`);
    console.log('='.repeat(60));
    
    try {
      const response = await axios.post(
        `${JIRA_URL}/rest/api/3/search/jql`,
        {
          jql: queries[i],
          maxResults: 10,
          fields: ['summary', 'status', 'updated', 'issuetype', 'assignee'],
        },
        {
          auth: {
            username: JIRA_EMAIL,
            password: JIRA_TOKEN,
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Found ${response.data.total} total, returned ${response.data.issues?.length || 0}`);
      
      if (response.data.issues && response.data.issues.length > 0) {
        response.data.issues.forEach((issue, idx) => {
          console.log(`\n${idx + 1}. ${issue.key} [${issue.fields.issuetype?.name}]`);
          console.log(`   ${issue.fields.summary}`);
          console.log(`   Status: ${issue.fields.status?.name}`);
          console.log(`   Updated: ${issue.fields.updated}`);
        });
      } else {
        console.log('⚠️ No issues found');
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
}

testJira();
