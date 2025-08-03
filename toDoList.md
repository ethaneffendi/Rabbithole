This is your todolist:
Rules:
1. Wait anywhere from 60 seconds to 600 seconds between API calls
2. DO NOT CHANGE OR REMOVE TASKS MARKED AS "recursive"
3. Once done judge if a task is done mark it as "completed" - this does not apply to "recursive" tasks
4. When encountering a "completed" task do not remove or change it 
5. Do not act on the code based on tasks that are already completed
6. Add every task done to the task log in toDoList.md
7. DO NOT CHANGE THE RULES
8. Do not use inline javascript this is built to be a chrome browser extension
9. Build with the code being a chrome browser extension in mind Flag anything that doesn't follow this and add it to tasks
10. Once the tasks are done generate dev logs in the DevLogs folder, create a new file for every major change

Tasks
1. Check the code for any errors "recursive"
2. Improve the code that contains errors "recursive"
3. Make the UI look more modern 
4. Suggest and write down more tasks to be done in toDoList.md - keep the mission statement in mind "recursive"
5. Refer to in toDoList.md for more your next task "recursive"
6. Implement a feature to save and load the graph data to local storage.
7. Implement a feature to allow users to customize the appearance of the graph.
8. Integrate with other AI models to provide more relevant website suggestions.
9. Add unit tests to the codebase to ensure code quality.
10. Implement a feature to allow users to export the graph as an image or other file format.

Task Log
1. Checked the code for any errors.
2. Improved the code that contains errors.
3. Made the UI look more modern.
4. Suggested and wrote down more tasks to be done in toDoList.md.

Mission Statement:
Inspiration
When we were researching potential projects for this Los Altos Hackathon, we searched for potential problems. One problem disturbed us greatly. Simply searching for these problems was a problem. A monstrosity of tabs was gathered in the browsers of all our screens. This problem is rather common when people are dealing with large research projects, leading to many large inefficiencies as they kept traveling down the rabbit hole of links. We wanted to solve this.

What it does
RabbitHole solves this data inefficiency problem by creating a interactive graph, quite like that of a neural network or a ontology graph. This graph allows users to see what past tabs they have opened and travel to them while remaining in the comfort of their tab. This is done through the use of a chrome extension, which is programmed using a variety of website building techniques and languages such as JavaScript, CSS, and html. AI also helps provide suggestions to the users by recommending extra websites for the user to explore while researching. Therefore, this lattice like graph can presents a solution to the unnecessary navigation of tabs and extra tabs while also making navigation easier and more satisfying.

How we built it
It was built using chrome's extensions. Our extension uses html, JavaScript (and JSON), CSS, and many other web building techniques to create an extension. In addition to that we also used the Gemini AI model to generate additional suggested websites for the user.

Challenges we ran into
There were many issues with integrating the AI Gemini model, specifically finding out how and where to host it, whether this would be done with Palantir or through some other method.

Accomplishments that we're proud of
We are also proud of the fact that even in a stressful and time-bound environment as first-timers (except for Mr. Effendi) we were able to create an application that we will all use regardless of whether it wins a prize.

What we learned
The difference between modules and normal JavaScript extension files. We learned how to host and use AI models like Gemini.

What's next for RabbitHole
Next, we plan to integrate RabbitHole with more browser platforms like Firefox and Edge. We also plan to add other features like the saving of these neural trees and graphs so that users can access them even after the workflow is closed. We can also add a AI tooltip that gives and AI summary of the website when the user hovers their mouse over the node. We also plan to add more UI/UX customization in the future, as well as other novel features to build a better user experience.