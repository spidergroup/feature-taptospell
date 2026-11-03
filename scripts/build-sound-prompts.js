import fs from 'node:fs';
import path from 'node:path';

const wordsData = [
  // 60 Spelling Words
  { word: 'apple', examples: ['I ate a sweet red apple for my afternoon snack.', 'An apple fell from the branch onto the grass.', 'Mom sliced an apple into small pieces for lunch.'] },
  { word: 'ball', examples: ['The children kicked the red soccer ball across the yard.', 'Can you throw the bouncy ball to me?', 'The puppy ran quickly to chase the tennis ball.'] },
  { word: 'bear', examples: ['The brown bear caught a fish in the cool river.', 'I sleep with my soft teddy bear every night.', 'A big bear rested peacefully inside the dark cave.'] },
  { word: 'bed', examples: ["I go to bed at 8 o'clock in the evening.", 'Please make your bed before going downstairs.', 'The little kitten curled up on the cozy bed.'] },
  { word: 'bell', examples: ['The school bell rings when morning class begins.', 'The golden bell on the door jingles when it opens.', 'Santa rang a shiny brass bell in his hand.'] },
  { word: 'bird', examples: ['A blue bird sang a lovely song in the tree.', 'The mama bird built a nest for her babies.', 'Look at that little bird hopping on the green grass.'] },
  { word: 'boat', examples: ['The small wooden boat sailed across the calm blue lake.', 'We wore life jackets before stepping onto the boat.', 'A white boat drifted gently along the flowing river.'] },
  { word: 'book', examples: ['Dad read an exciting story book before bedtime.', 'I borrowed a picture book about dinosaurs from the library.', 'Please open your reading book to the first page.'] },
  { word: 'box', examples: ['She packed her crayons into the colorful pencil box.', 'A surprise birthday present was hidden inside the big box.', 'The curious cat jumped inside the empty cardboard box.'] },
  { word: 'bread', examples: ['We toasted two slices of warm wheat bread.', 'The sweet baker made fresh sourdough bread this morning.', 'Spread some peanut butter and strawberry jam on the bread.'] },
  { word: 'cake', examples: ['We blew out the candles on the birthday cake.', 'Grandma baked a delicious chocolate sponge cake.', 'Would you like a slice of vanilla strawberry cake?'] },
  { word: 'car', examples: ['Dad parked the blue family car in the garage.', 'We buckled our seatbelts before the car started.', 'The toy car zoomed across the living room rug.'] },
  { word: 'cat', examples: ['The orange cat purred happily in my warm lap.', 'Our friendly cat likes to chase little yarn balls.', 'The fluffy cat took a quiet nap on the windowsill.'] },
  { word: 'chair', examples: ['Please pull up a wooden chair to the kitchen table.', 'Grandpa sat back in his comfortable rocking chair.', 'I placed my backpack neatly next to the desk chair.'] },
  { word: 'clock', examples: ["The wall clock in the classroom shows nine o'clock.", 'The alarm clock buzzed loudly to wake us up.', 'Look at the round clock to see what time it is.'] },
  { word: 'coat', examples: ['Zip up your warm winter coat before stepping outside.', 'I hung my yellow rain coat on the hook by the door.', 'Her fluffy coat kept her toasty in the chilly wind.'] },
  { word: 'corn', examples: ['We ate sweet yellow corn on the cob at the picnic.', 'Tall green corn stalks grew high in the summer field.', 'Farmers harvest fresh golden corn in the crisp autumn.'] },
  { word: 'cow', examples: ['The black and white cow chewed grass in the pasture.', 'The friendly cow gave fresh milk every morning.', 'A mother cow gently watched over her baby calf.'] },
  { word: 'dog', examples: ['The playful golden dog wagged its tail with joy.', 'We take our friendly dog for a walk in the park.', 'The loyal dog learned how to sit and fetch the stick.'] },
  { word: 'door', examples: ['Please close the front door gently when you leave.', 'Someone knocked softly on the wooden bedroom door.', 'The red door opened to reveal a sunny backyard.'] },
  { word: 'drum', examples: ['He tapped a steady beat on the wooden marching drum.', 'The loud drum echoed throughout the school parade.', 'She played the toy drum with two small wooden sticks.'] },
  { word: 'duck', examples: ['The yellow duck paddled across the sunny pond.', 'A mother duck led her fluffy ducklings in a line.', 'The little duck quacked loudly as it splashed in water.'] },
  { word: 'egg', examples: ['The blue robin laid a tiny speckled egg in the nest.', 'Dad fried an egg sunny-side up for Sunday breakfast.', 'Be gentle so you do not drop and crack the egg.'] },
  { word: 'eye', examples: ['Wink one eye if you know the secret answer.', 'The eagle has sharp vision and a keen watchful eye.', 'She closed each eye and counted slowly to ten.'] },
  { word: 'farm', examples: ['Roosters crowed early in the morning on the farm.', 'We picked juicy red apples at the local fruit farm.', 'Horses and sheep grazed peacefully around the sunny farm.'] },
  { word: 'feet', examples: ['Put warm woolly socks on your cold feet.', 'We dipped our bare feet into the refreshing lake water.', 'She tapped her feet to the rhythm of the happy music.'] },
  { word: 'fish', examples: ['An orange fish swam gracefully around the aquarium bowl.', 'We watched tiny silver fish dart through the clear pond.', 'Grandpa caught a shiny trout fish at the lake.'] },
  { word: 'flower', examples: ['A bright yellow flower bloomed in the garden soil.', 'A fuzzy bumblebee landed on the fragrant purple flower.', 'She picked a lovely pink flower for her teacher.'] },
  { word: 'frog', examples: ['A little green frog hopped onto a floating lily pad.', 'The frog caught a buzzing fly with its long tongue.', 'We heard a cheerful frog croaking by the pond at dusk.'] },
  { word: 'garden', examples: ['We planted juicy tomatoes and crisp carrots in the garden.', 'Bright red tulips blossomed all over the sunny garden.', 'Grandma watered the thirsty vegetable garden every afternoon.'] },
  { word: 'grass', examples: ['The children ran barefoot across the soft green grass.', 'Morning dew sparkled brightly on the fresh lawn grass.', 'A rabbit nibbled quietly on the sweet garden grass.'] },
  { word: 'hand', examples: ['Wash your hand with warm water and soap before dinner.', 'She raised her hand to ask the teacher a question.', 'Hold my hand tightly while we cross the busy street.'] },
  { word: 'hat', examples: ['Wear your wide-brimmed sun hat on bright sunny days.', 'The playful wind blew my baseball hat right off my head.', 'He put on a warm knitted winter hat with a pom-pom.'] },
  { word: 'hill', examples: ['We rode our sleds quickly down the snowy white hill.', 'A solitary oak tree stood tall atop the grassy hill.', 'The children raced each other to the summit of the hill.'] },
  { word: 'horse', examples: ['The brown horse galloped swiftly across the open meadow.', 'She gently brushed the long mane of her pet horse.', 'The friendly horse ate crunchy red apples from my hand.'] },
  { word: 'house', examples: ['Our cozy brick house has a white fence and a porch.', 'Smoke rose gently from the chimney of the little house.', 'Grandma invited all her grandchildren into her warm house.'] },
  { word: 'leg', examples: ['The athletic frog hopped using its strong back leg.', 'He stretched out each leg before running the school race.', 'I stood on one leg like a graceful pink flamingo.'] },
  { word: 'milk', examples: ['Pour a cold glass of fresh milk to drink with cookies.', 'The newborn kitten drank warm milk from a tiny saucer.', 'Mom added a splash of creamy milk into the pancake batter.'] },
  { word: 'nest', examples: ['The robin built a sturdy nest out of twigs and grass.', 'Three small blue speckled eggs rested safely in the nest.', 'The baby chicks chirped happily inside their warm nest.'] },
  { word: 'paper', examples: ['Draw a colorful rainbow on this clean sheet of white paper.', 'Fold the square craft paper neatly to create a paper airplane.', 'She wrote a sweet thank-you note on lined paper.'] },
  { word: 'pig', examples: ['A playful pink pig rolled happily in the cool mud.', 'The hungry pig grunted contentedly at feeding time.', 'The farmer gave fresh vegetables to the chubby pig.'] },
  { word: 'rain', examples: ['Cool rain fell gently against the bedroom window glass.', 'Put on your waterproof boots so you can splash in the rain.', 'The thirsty garden flowers perked up after the morning rain.'] },
  { word: 'ring', examples: ['She wore a shiny golden ring with a sparkling blue stone.', 'The children joined hands to form a big happy ring.', 'We heard the telephone ring twice in the hallway.'] },
  { word: 'seed', examples: ['Plant a tiny black seed into the rich dark soil.', 'With sunshine and water, the little seed will sprout.', 'A hungry sparrow pecked up every sunflower seed.'] },
  { word: 'sheep', examples: ['The fluffy white sheep grazed calmly on the green hillside.', 'The farmer sheared warm wool from the gentle sheep.', 'A mother sheep called out softly to her little lamb.'] },
  { word: 'ship', examples: ['The grand sailing ship ventured across the vast blue ocean.', 'Sailors raised the giant white sails of the wooden ship.', 'We spotted a distant cargo ship on the ocean horizon.'] },
  { word: 'shoe', examples: ['Tie the laces on your left sneaker shoe tightly.', 'I kicked off each shoe before stepping onto the carpet.', 'She found her missing blue shoe underneath the bed.'] },
  { word: 'snow', examples: ['Soft white snow fell quietly from the winter sky all night.', 'We built a smiling snowman out of the fresh cold snow.', 'The trees were coated in a blanket of sparkling snow.'] },
  { word: 'song', examples: ['The choir sang a cheerful song for the school assembly.', 'A sweet morning songbird chirped a happy melody.', 'We learned the lyrics to a new nursery song today.'] },
  { word: 'stick', examples: ['The playful puppy fetched the wooden stick from the yard.', 'We toasted marshmallows over the campfire on a long stick.', 'A dry branch stick snapped beneath my boots in the woods.'] },
  { word: 'sun', examples: ['The bright golden sun rose over the eastern mountains.', 'Soak up the warm sunshine on this pleasant summer day.', 'The sun gave energy and light to all the growing plants.'] },
  { word: 'table', examples: ['Set the plates, forks, and cups on the dining table.', 'We gathered around the kitchen table to eat dinner together.', 'She finished her homework while sitting at the wooden table.'] },
  { word: 'top', examples: ['Spin the colorful wooden top across the smooth kitchen floor.', 'Snow covered the very top of the highest mountain peak.', 'He placed a shiny golden star on top of the Christmas tree.'] },
  { word: 'toy', examples: ['She shared her favorite wooden train toy with her friend.', 'Put your building blocks back into the toy chest after play.', 'The baby giggled while shaking the colorful rattle toy.'] },
  { word: 'tree', examples: ['An ancient apple tree gave cool shade in the backyard.', 'Birds perched safely high up in the leafy branches of the tree.', 'Leaves on the maple tree turned brilliant orange in autumn.'] },
  { word: 'watch', examples: ['My dad glanced at his wrist watch to check the time.', 'We sat together on the hill to watch the sunset.', 'The new watch has a shiny blue strap and clear numbers.'] },
  { word: 'water', examples: ['Drink plenty of cool fresh water after playing outside.', 'Ripples formed on the surface of the clear blue water.', 'The gardener sprayed clean water over the thirsty plants.'] },
  { word: 'wind', examples: ['A gentle breeze of cool wind rustled the autumn leaves.', 'The strong wind lifted the colorful kite high into the sky.', 'We listened to the howling wind outside our warm house.'] },
  { word: 'window', examples: ['Open the bedroom window to let in the fresh morning air.', 'Sunlight streamed brightly through the clean glass window.', 'I looked out the window and saw birds flying across the sky.'] },
  { word: 'wood', examples: ['Dad stacked split birch wood beside the living room fireplace.', 'The antique dining table is crafted from solid oak wood.', 'We walked through the peaceful green pine wood forest.'] },

  // 70 Sight Words
  { word: 'about', examples: ['The teacher read a book about wild African animals.', "We arrived at the playground at about two o'clock.", 'Tell me all about your exciting first day at school.'] },
  { word: 'again', examples: ['Can you please read that funny bedtime story again?', 'The puppy wagged its tail when we threw the ball again.', 'Practice spelling the word again until you feel confident.'] },
  { word: 'always', examples: ['Always wash your hands before eating dinner.', 'The morning sun always rises in the eastern sky.', 'She always shares her toys kindly with her friends.'] },
  { word: 'and', examples: ['Mom packed peanut butter and jelly sandwiches for our lunch.', 'We went to the park and played on the swings.', 'The friendly cat and dog curled up together by the fire.'] },
  { word: 'because', examples: ['I put on my raincoat because dark clouds brought heavy rain.', 'We smiled because the silly puppy did a funny trick.', 'He stayed home from school because he had a little cold.'] },
  { word: 'big', examples: ['An enormous big blue whale swam in the deep ocean.', 'Dad baked a big chocolate birthday cake for everyone.', 'The friendly golden retriever had big floppy brown ears.'] },
  { word: 'both', examples: ['Both of my hands were covered in colorful finger paint.', 'She loves both vanilla and chocolate ice cream scoops.', 'Both brothers wore matching blue coats to the park.'] },
  { word: 'buy', examples: ['We went to the grocery store to buy fresh fruits.', 'He saved his pocket money to buy a new puzzle.', 'Mom promised to buy delicious crunchy apples today.'] },
  { word: 'can', examples: ['Can you help me build this tall block tower?', 'The fast cheetah can run quicker than any other animal.', 'I know that you can spell this word all by yourself.'] },
  { word: 'could', examples: ['She ran as fast as she could to catch the school bus.', 'Could you please pass the pitcher of cold water?', 'He wondered if he could climb all the way to the top.'] },
  { word: 'cut', examples: ['Use safety scissors to cut along the dotted line.', 'Mom used a sharp knife to cut the juicy watermelon.', 'He helped cut the wrapping paper for the birthday gift.'] },
  { word: 'does', examples: ['Does your pet puppy know how to fetch a tennis ball?', 'The train does stop at our local town station.', 'She always does her homework right after school.'] },
  { word: 'done', examples: ['I am completely done with my math homework now.', 'When your chores are done, you may go outside to play.', 'The freshly baked cookies are done and cooling on the rack.'] },
  { word: 'eight', examples: ['A spider has eight long legs to crawl on.', 'The clock chimed eight times in the morning.', 'She celebrated her eight birthday with all her classmates.'] },
  { word: 'every', examples: ['Every student in the classroom received a gold star.', 'We brush our teeth every morning and every night.', 'Every single flower in the garden began to bloom.'] },
  { word: 'fast', examples: ['The sleek cheetah is famous for running very fast.', 'He pedaled his bicycle fast to race down the sidewalk.', 'Fast swimmers glided smoothly through the pool water.'] },
  { word: 'first', examples: ['The letter A is the very first letter of the alphabet.', 'She was the first runner to cross the finish line.', 'First put on your socks, and then put on your shoes.'] },
  { word: 'full', examples: ['The blue sky was bright under the round full moon.', 'Her school backpack was full of colorful storybooks.', 'I ate a healthy lunch and my tummy feels nice and full.'] },
  { word: 'goes', examples: ['The yellow school bus goes down Elm Street every morning.', 'My older brother goes to elementary school with me.', 'The sun goes down in the western sky at sunset.'] },
  { word: 'good', examples: ['She did a good job finishing all her reading lessons.', 'Eating fresh fruits and vegetables is good for your health.', 'Have a good night and pleasant dreams as you sleep.'] },
  { word: 'had', examples: ['We had a wonderful picnic under the shady oak tree.', 'She had three red balloons floating in her hand.', 'The puppy had a long afternoon nap on the rug.'] },
  { word: 'have', examples: ['Do you have enough colored pencils for the drawing project?', 'We have two friendly pet cats living in our house.', 'I have an exciting new book to read tonight.'] },
  { word: 'he', examples: ['He put on his favorite blue baseball cap before going out.', 'My little brother smiled because he learned to ride a bike.', 'He reads chapter books every evening before bed.'] },
  { word: 'her', examples: ['She tied her hair with a pretty purple ribbon.', 'Her teacher praised her for being so kind and helpful.', 'We listened closely to her lovely flute performance.'] },
  { word: 'him', examples: ['I gave him a high five when his team scored a goal.', 'We invited him to join our fun playground game.', 'She baked him a delicious batch of chocolate chip cookies.'] },
  { word: 'his', examples: ['He packed his favorite dinosaur book into his backpack.', 'His friendly smile cheered up everyone in the room.', 'He rode his shiny red bicycle all the way home.'] },
  { word: 'hot', examples: ['Be very careful because the cup of hot soup is steaming.', 'The summer afternoon was sunny, bright, and very hot.', 'We warmed our hands with a comforting mug of hot cocoa.'] },
  { word: 'into', examples: ['The brave frog leaped into the cool pond water.', 'She tucked the letter neatly into the envelope.', 'We stepped out of the cold wind and walked into the house.'] },
  { word: 'jump', examples: ['Watch how high the energetic puppy can jump.', 'The children love to jump in puddles after the rain.', 'Take a big jump over the blue chalk line on the ground.'] },
  { word: 'laugh', examples: ['The silly cartoon character made the children laugh loudly.', 'Her cheerful laugh brought a smile to everyone around.', 'We always laugh when my dog chases its own tail.'] },
  { word: 'light', examples: ['Turn on the reading light so you can see the pages clearly.', 'The morning sunlight brought warmth to the bedroom.', 'The feather was so light that it drifted gently in the breeze.'] },
  { word: 'look', examples: ['Look at that colorful rainbow appearing in the sky!', 'Always look both ways before crossing the street.', 'Take a look inside the box to discover the surprise.'] },
  { word: 'many', examples: ['There were many bright stars shining in the night sky.', 'How many colorful apples are inside the picnic basket?', 'Many children gathered on the playground at recess.'] },
  { word: 'myself', examples: ['I tied my own shoelaces all by myself today.', 'I looked in the mirror and smiled at myself.', 'I drew a lovely picture of my family all by myself.'] },
  { word: 'never', examples: ['Never run across the street without an adult nearby.', 'A true friend will never leave you feeling left out.', 'He had never seen the ocean until this summer vacation.'] },
  { word: 'of', examples: ['She drank a tall glass of cold orange juice.', 'A flock of white birds flew across the sunny horizon.', 'This is the very first day of our school vacation.'] },
  { word: 'one', examples: ['There is only one last cookie remaining on the plate.', 'One sunny morning, the baby bird left its nest.', 'Count from number one all the way up to ten.'] },
  { word: 'own', examples: ['Every student has their own personal cubby for coats.', 'She decorated her own bedroom with drawings and posters.', 'He is proud that he can bake cookies on his own.'] },
  { word: 'play', examples: ['Do you want to play a fun board game with me?', 'The happy puppies love to play tag in the backyard.', 'Children play outside in the sunshine during afternoon recess.'] },
  { word: 'please', examples: ['Please pass the sweet strawberry jam across the table.', 'Remember to say please and thank you when asking.', 'Could you please help me pick up the colored blocks?'] },
  { word: 'pretty', examples: ['A pretty purple butterfly fluttered above the flowers.', 'She wore a pretty floral dress to the family dinner.', 'The sunset painted the evening sky in pretty pastel colors.'] },
  { word: 'read', examples: ['I like to read exciting adventure books before sleeping.', 'Can you read the words on this flashcard out loud?', 'Our teacher read a charming story to the whole class.'] },
  { word: 'red', examples: ['The cardinal bird has bright red feathers on its wings.', 'She picked a ripe red strawberry from the garden patch.', 'The shiny red fire truck raced past with flashing lights.'] },
  { word: 'run', examples: ['The children love to run across the grassy sports field.', 'See how fast the brown puppy can run to get the stick.', 'Run inside quickly before the raindrops start falling.'] },
  { word: 'said', examples: ['Mom smiled and said that we did a wonderful job.', '"Good morning!" said the teacher as we entered class.', 'He said he would share his colored markers with everyone.'] },
  { word: 'see', examples: ['Can you see the yellow school bus coming down the road?', 'Look through the telescope to see the craters on the moon.', 'I see two sweet little bunnies hopping near the bushes.'] },
  { word: 'seven', examples: ['There are seven days in every single week.', 'The rainbow in the sky has seven beautiful colors.', 'She turned seven years old on her birthday yesterday.'] },
  { word: 'she', examples: ['She scored the winning goal in the soccer match.', 'My sister smiled because she found her lost teddy bear.', 'She loves drawing pictures of magical fairytale castles.'] },
  { word: 'some', examples: ['Would you like some fresh honey on your warm toast?', 'Some birds fly south to warmer places during the winter.', 'I picked some fragrant wild daisies from the meadow.'] },
  { word: 'that', examples: ['Look at that soaring eagle high up in the blue sky!', 'Is that your blue backpack resting on the wooden chair?', 'I really enjoyed reading that exciting dinosaur book.'] },
  { word: 'the', examples: ['The morning sun warmed the cool dew on the grass.', 'We opened the front door to welcome our guests.', 'The little kitten slept peacefully in the wicker basket.'] },
  { word: 'their', examples: ['The children put their backpacks into their assigned cubbies.', 'The birds built their cozy twig nest high in the tree.', 'The students showed their artwork to their proud parents.'] },
  { word: 'them', examples: ['I gathered all the crayons and placed them in the box.', 'We invited them to join our game of kickball at recess.', 'Listen to the birds singing and enjoy them in the morning.'] },
  { word: 'then', examples: ['We washed our hands and then sat down to enjoy lunch.', 'First finish your homework, and then you may play outside.', 'The storm passed and then a bright colorful rainbow appeared.'] },
  { word: 'there', examples: ['Look over there near the tall pine tree to spot the deer.', 'There are five juicy red apples inside the fruit bowl.', 'We walked to the park and sat there on the wooden bench.'] },
  { word: 'they', examples: ['They worked cooperatively to assemble the giant puzzle.', 'The friendly neighbors smiled as they waved hello.', 'They ran across the playground laughing and having fun.'] },
  { word: 'to', examples: ['We are walking to the public library to borrow books.', 'Give this handcrafted greeting card to your grandmother.', 'She looked forward to visiting her cousins this weekend.'] },
  { word: 'try', examples: ['Always try your best even when a challenge seems tricky.', 'I will try this new vegetable dish at dinner tonight.', 'Take a deep breath and try to solve the puzzle again.'] },
  { word: 'two', examples: ['I have two soft wool mittens to keep my hands warm.', 'Two friendly bluebirds perched on the wooden bird feeder.', 'She counted two shining stars through her bedroom window.'] },
  { word: 'us', examples: ['The teacher showed us how to fold origami paper boats.', 'Come with us to the park for a sunny afternoon picnic.', 'Mom baked warm chocolate cookies for all of us to share.'] },
  { word: 'use', examples: ['Use a sharp pencil when writing words in your workbook.', 'We can use bright watercolors to paint this landscape.', 'Always use kind words when speaking with your friends.'] },
  { word: 'want', examples: ['Do you want some sliced strawberries on your cereal?', 'I want to learn how to play the acoustic guitar.', 'The hungry puppies want their evening meal now.'] },
  { word: 'warm', examples: ['The soft woolen blanket kept me warm all through the night.', 'We sat beside the fireplace to enjoy the warm fire.', 'A warm spring breeze melted the remaining winter snow.'] },
  { word: 'was', examples: ['Yesterday was a pleasant and sunny afternoon at the zoo.', 'She was very happy when she finished reading the book.', 'The water in the swimming pool was cool and refreshing.'] },
  { word: 'were', examples: ['The excited children were playing games on the playground.', 'All the colorful birds were singing in the early morning.', 'We were delighted to see our grandparents at the door.'] },
  { word: 'what', examples: ['What is your favorite flavor of birthday ice cream?', 'She wondered what kind of bird was singing in the tree.', 'What a wonderful job you did on your spelling practice!'] },
  { word: 'when', examples: ['When the school bell rings, it is time for lunch recess.', 'Call out when you are ready to play hide and seek.', 'I smile happily when we visit our favorite park.'] },
  { word: 'which', examples: ['Which colored crayon would you like to use for the sky?', 'She did not know which storybook she wanted to read first.', 'Which path through the woods leads down to the lake?'] },
  { word: 'with', examples: ['She drew a beautiful picture with her new set of markers.', 'We enjoy playing board games with our family on weekends.', 'The friendly puppy walked side by side with the child.'] },
  { word: 'would', examples: ['Would you like a glass of cold lemonade on this hot day?', 'She said that she would love to come to the birthday party.', 'He wondered how high the colorful kite would fly in the wind.'] }
];

let md = '# TapToSpell — Sound Generation Prompt List & Contextual Examples\n\n';
md += 'This document provides complete, copy-pasteable audio generation prompts for **all 130 words** in the TapToSpell curriculum, with **3 kid-friendly contextual example sentences** per word (designed for young learners ages 5–8), as well as audio prompts for all UI sound effects.\n\n';
md += '## Quick Audio Specs\n';
md += '- **Target Folder:** `public/sounds/words/{word}.mp3`\n';
md += '- **Audio Format:** MP3, 44.1 kHz, 128 kbps, mono or stereo\n';
md += '- **Spoken Voice Tone:** Friendly, warm, articulate female or male voice (US English), phonetically clear, ~1.0–1.5s for standalone words.\n\n---\n\n';

md += '## Part 1: 60 Picturable Spelling Words\n\n';
for (let i = 0; i < 60; i++) {
  const item = wordsData[i];
  md += `### ${i + 1}. **${item.word}**\n`;
  md += `- **File Path:** \`public/sounds/words/${item.word}.mp3\`\n`;
  md += `- **Spoken Word:** "${item.word}"\n`;
  md += `- **Audio Prompt:** *"Say the word '${item.word}' clearly, gently, and with a warm, encouraging smile. Pause 100ms before and after."*\n`;
  md += `- **3 Contextual Example Sentences:**\n`;
  for (let j = 0; j < item.examples.length; j++) {
    md += `  ${j + 1}. *"${item.examples[j]}"*\n`;
  }
  md += '\n';
}

md += '---\n\n## Part 2: 70 Dolch Sight Words\n\n';
for (let i = 60; i < wordsData.length; i++) {
  const item = wordsData[i];
  md += `### ${i - 59}. **${item.word}**\n`;
  md += `- **File Path:** \`public/sounds/words/${item.word}.mp3\`\n`;
  md += `- **Spoken Word:** "${item.word}"\n`;
  md += `- **Audio Prompt:** *"Say the sight word '${item.word}' clearly, gently, and at an articulate, natural pace for young children."*\n`;
  md += `- **3 Contextual Example Sentences:**\n`;
  for (let j = 0; j < item.examples.length; j++) {
    md += `  ${j + 1}. *"${item.examples[j]}"*\n`;
  }
  md += '\n';
}

md += '---\n\n## Part 3: UI Sound Effects Prompts\n\n';
md += '### Success Chimes (`public/sounds/success/`)\n';
md += '1. **`chime-3.mp3`**\n   - **Prompt:** *"Crisp, joyful pentatonic glissando on a wooden harp and orchestral bells, ascending quickly (0.8 seconds), cheerful and rewarding, clean stereo reverb, zero harsh high frequencies."*\n';
md += '2. **`chime-4.mp3`**\n   - **Prompt:** *"Warm melodic xylophone chord progression resolving on a major triad (0.7 seconds), cozy cartoon celebration sound, gentle room acoustics, positive video game achievement feel."*\n';
md += '3. **`chime-5.mp3`**\n   - **Prompt:** *"Magical sparkle sound with delicate wind chimes and bright chime bell ding (1.0 second), celebratory victory sound for kids, smooth fade-out."*\n\n';

md += '### Retry / Wobble Sounds (`public/sounds/retry/`)\n';
md += '1. **`boing-3.mp3`**\n   - **Prompt:** *"Gentle, soft water bubble popping with a cute low pitch wobble (0.4 seconds), playful and encouraging, never harsh or punitive, zero buzzer tones."*\n';
md += '2. **`boing-4.mp3`**\n   - **Prompt:** *"Subtle hollow cartoon woodblock bounce (0.5 seconds), warm playful rattle, friendly try-again indicator for preschool learners."*\n';
md += '3. **`boing-5.mp3`**\n   - **Prompt:** *"Bouncy gentle rubber band twang (0.5 seconds), bouncy cartoon spring sound, lighthearted and fun, non-threatening failure feedback."*\n';

fs.writeFileSync('docs/sound-prompts.md', md, 'utf8');
fs.writeFileSync('C:\\Users\\sambo\\.gemini\\antigravity\\brain\\20f1024f-f940-4552-a841-ca20d2a8e43a\\sound-prompts.md', md, 'utf8');
console.log('Successfully wrote docs/sound-prompts.md and artifact, total words:', wordsData.length);

