"""
CiviSense AI — Synthetic Training Data Generator

Generates realistic civic complaint text data for training ML models.
Each category gets ~50 diverse complaint samples with varied language,
length, and complexity levels.

This is the bootstrap strategy when real complaint data is scarce.
As real data accumulates, retrain models on production data.
"""

import random
from typing import List, Tuple

# ─── Complaint Templates per Category ──────────────────────────
# Each template is (title_template, description_template)
# Variables: {location}, {duration}, {detail}

LOCATIONS = [
    "MG Road", "Gandhi Nagar", "Nehru Colony", "Station Road", "Market Area",
    "Indira Nagar", "Jubilee Hills", "Old City", "New Town", "Civil Lines",
    "Rajiv Chowk", "Patel Nagar", "Ambedkar Colony", "Bus Stand Area",
    "Railway Station", "Industrial Area", "University Road", "Hospital Road",
    "School Lane", "Temple Street", "Mosque Road", "Church Street",
    "Ring Road", "Bypass Road", "National Highway", "Main Bazaar",
    "Sadar Area", "Cantonment", "Lal Bagh", "Green Park",
]

DURATIONS = [
    "for 2 days", "since last week", "for the past 3 days",
    "since yesterday", "for over a week", "for the past month",
    "since 5 days", "for 10 days now", "since last Monday",
    "for 2 weeks", "since morning", "for the past 48 hours",
]

TEMPLATES = {
    "WATER_SUPPLY": [
        ("No water supply in {location}", "There has been no water supply in our area {duration}. Residents are struggling to get drinking water. Many families have small children who need clean water. Please restore water supply immediately."),
        ("Water pipe burst near {location}", "A major water pipe has burst near {location} causing flooding and water wastage. Water is flowing onto the road {duration}. The pipe needs urgent repair to stop the wastage and restore supply."),
        ("Contaminated water coming from taps in {location}", "The tap water in {location} has turned brown and has a foul smell {duration}. It is not safe for drinking or cooking. Several families have fallen sick after consuming this water."),
        ("Low water pressure in {location}", "The water pressure in our area has been extremely low {duration}. It takes hours to fill a single bucket. The overhead tanks remain empty. We need water tanker supply until the issue is fixed."),
        ("Water leakage from main pipeline at {location}", "There is continuous water leakage from the main pipeline near {location}. Thousands of liters of water are being wasted daily {duration}. The road is waterlogged and slippery."),
        ("Bore well not functioning in {location}", "The community bore well at {location} has stopped working {duration}. This is the only source of water for many families in the area. Urgent repair needed."),
        ("Water tanker not arriving in {location}", "The scheduled water tanker has not been arriving in {location} {duration}. The area depends entirely on tanker supply. Senior citizens and pregnant women are most affected."),
        ("Sewage mixing with drinking water in {location}", "Sewage water is getting mixed with drinking water supply in {location}. This has been happening {duration}. Multiple cases of diarrhea have been reported. This is a health emergency."),
    ],
    "ELECTRICITY": [
        ("Power outage in {location}", "There has been no electricity in {location} {duration}. The entire locality is affected. Transformer seems to be damaged. Food is getting spoiled in refrigerators and students cannot study."),
        ("Frequent power cuts in {location}", "We are experiencing frequent power cuts {duration} in {location}. Power goes off 5-6 times daily for 2-3 hours each time. This is affecting businesses and daily life severely."),
        ("Exposed electric wire near {location}", "There is a dangerously exposed high-tension electric wire hanging low near {location}. This is a serious safety hazard especially for children. Someone could get electrocuted any moment."),
        ("Transformer burning in {location}", "The electricity transformer near {location} has been sparking and overheating {duration}. There is a burning smell. Residents fear it could catch fire or explode. Urgent replacement needed."),
        ("No street light and no power in {location}", "Both street lights and domestic power supply have been disrupted in {location} {duration}. The area is completely dark at night making it unsafe for women and elderly."),
        ("Electric pole tilted dangerously at {location}", "An electric pole at {location} has tilted dangerously after recent rains. The wires are hanging low and could fall anytime. This is life-threatening for passersby."),
        ("Voltage fluctuation damaging appliances in {location}", "Severe voltage fluctuation {duration} in {location}. Several households have reported damage to refrigerators, TVs, and washing machines. The fluctuation is unbearable."),
    ],
    "ROAD_DAMAGE": [
        ("Huge pothole on {location}", "There is a massive pothole on {location} that has been growing {duration}. Multiple vehicles have been damaged. Yesterday a two-wheeler slipped and the rider was injured. Immediate repair needed."),
        ("Road completely damaged near {location}", "The road near {location} is in terrible condition with cracks and potholes everywhere. It has been like this {duration}. Vehicles cannot pass safely. An accident is waiting to happen."),
        ("Road cave-in at {location}", "A section of the road at {location} has caved in {duration}. The depression is about 3 feet deep. Vehicles are taking dangerous diversions. This needs emergency repair."),
        ("Broken speed breaker at {location}", "The speed breaker at {location} is broken and has sharp edges. {duration} it has been causing damage to vehicles. At night, drivers cannot see it and crash into it."),
        ("Road not constructed after digging at {location}", "The road at {location} was dug up for pipeline work and never restored properly. It has been {duration} and the road is still unpaved with mud and stones. Impossible to drive."),
        ("Waterlogged road due to potholes at {location}", "Potholes on {location} are filled with stagnant water {duration}. The road becomes a death trap during rains. Mosquito breeding is also a concern due to standing water."),
    ],
    "SEWAGE": [
        ("Sewage overflow at {location}", "Raw sewage is overflowing from the main drain near {location}. The entire street is flooded with dirty water {duration}. The stench is unbearable and it is a major health hazard."),
        ("Open manhole at {location}", "There is an open manhole without a cover at {location}. It has been open {duration}. A child nearly fell into it yesterday. This is extremely dangerous especially at night."),
        ("Blocked sewer line in {location}", "The sewer line in {location} is completely blocked {duration}. Sewage water is backing up into houses. Multiple families are affected and the situation is getting worse every day."),
        ("Sewage entering houses in {location}", "Sewage water is entering multiple houses in {location} {duration}. The drainage system is completely choked. Families cannot live in their homes. Immediate action required."),
        ("Foul smell from sewage in {location}", "There is an unbearable foul smell coming from the open sewage drain at {location} {duration}. It is causing nausea and respiratory problems. The drain needs cleaning and covering."),
    ],
    "GARBAGE": [
        ("Garbage not collected in {location}", "Garbage has not been collected in {location} {duration}. The bins are overflowing and garbage is scattered on the streets. Stray dogs are tearing open the garbage bags."),
        ("Garbage dump near residential area at {location}", "There is a large garbage dump right next to the residential area at {location}. It has been growing {duration}. The smell is terrible and mosquitoes and flies are everywhere."),
        ("Overflowing garbage bins at {location}", "The garbage bins at {location} have been overflowing {duration}. No one has come to empty them. Garbage is piling up on the streets and creating unsanitary conditions."),
        ("Burning of garbage at {location}", "Someone is burning garbage regularly at {location}. This has been happening {duration}. The smoke is toxic and causing breathing problems for residents especially children and elderly."),
        ("No dustbins installed in {location}", "There are no dustbins or waste collection bins in {location}. People are forced to throw garbage on the street. This has been an issue {duration}. We need proper waste management."),
    ],
    "STREETLIGHT": [
        ("Street lights not working at {location}", "Multiple street lights are not working at {location} {duration}. The entire stretch is dark at night. It is unsafe for pedestrians especially women. Several incidents of chain snatching reported."),
        ("Dark road at {location} due to broken lights", "The road at {location} is completely dark at night because all street lights are broken {duration}. There have been accidents because drivers cannot see the road properly."),
        ("Street light pole fallen at {location}", "A street light pole has fallen on the road at {location}. It has been lying there {duration}. The wires are exposed and it is blocking traffic. Dangerous for everyone."),
        ("No street lights installed in new area at {location}", "The newly developed area near {location} has no street lights at all. Residents have been requesting installation {duration}. Walking at night is very risky."),
        ("Faulty street light flickering at {location}", "A street light at {location} has been flickering continuously {duration}. It is creating a strobe effect that is disorienting for drivers. Could cause an accident."),
    ],
    "TRAFFIC": [
        ("Traffic signal not working at {location}", "The traffic signal at {location} junction has stopped working {duration}. There is massive traffic congestion and near-miss accidents daily. Traffic police are also not present."),
        ("Illegal parking blocking road at {location}", "Vehicles are being parked illegally on both sides of the road at {location} {duration}. This has narrowed the road to single lane. Emergency vehicles cannot pass through."),
        ("No zebra crossing at busy junction near {location}", "There is no zebra crossing or pedestrian signal at the busy junction near {location}. Pedestrians risk their lives crossing. An elderly person was hit last week."),
        ("Traffic congestion due to encroachment at {location}", "Road encroachment by street vendors at {location} is causing severe traffic jams {duration}. The main road is reduced to a narrow lane during peak hours."),
        ("Missing road signs at {location}", "Important road signs are missing at {location} junction {duration}. There is no speed limit sign, no turn indicators. Outsiders and new drivers get confused and accidents happen."),
    ],
    "PUBLIC_SAFETY": [
        ("Dangerous building about to collapse at {location}", "An old building at {location} is in a very dangerous condition. Cracks are visible and pieces of concrete are falling. It could collapse anytime and endanger lives of people nearby."),
        ("Gas leak reported near {location}", "There is a strong smell of gas near {location}. Residents suspect a gas pipeline leak. This is an emergency situation as it could lead to an explosion. Immediate inspection needed."),
        ("Unsafe construction near school at {location}", "There is unauthorized unsafe construction happening near the school at {location}. Heavy machinery is being used without safety barriers. Children are at risk."),
        ("Fallen tree blocking road and power lines at {location}", "A large tree has fallen on the road at {location} blocking traffic and pulling down power lines. Live wires are on the ground. Extremely dangerous. Emergency clearing needed."),
        ("Fire hazard from illegal storage at {location}", "Inflammable materials are being stored illegally in a godown at {location}. It is surrounded by residential buildings. A fire here could be catastrophic. Needs immediate inspection."),
    ],
    "ANIMAL_CONTROL": [
        ("Stray dogs attacking people at {location}", "A pack of stray dogs has been attacking pedestrians at {location} {duration}. Three people including a child have been bitten. The dogs are aggressive and may be rabid."),
        ("Stray cattle on main road at {location}", "Stray cattle are regularly seen on the main road at {location} {duration}. They cause traffic accidents and block the road. Yesterday a motorcycle collided with a cow."),
        ("Snake sighting in residential area at {location}", "Multiple snake sightings have been reported in the residential area at {location} {duration}. Residents are terrified. A cobra was seen near the children's playground."),
        ("Monkey menace at {location}", "Monkeys have been entering houses and stealing food at {location} {duration}. They have bitten two residents. People are scared to keep windows open. Animal control needed."),
        ("Stray dog bite incident at {location}", "My child was bitten by a stray dog near {location}. There are many stray dogs in this area. We need vaccination drive and animal control measures immediately."),
    ],
    "DRAINAGE": [
        ("Blocked drain causing waterlogging at {location}", "The main drain at {location} is completely blocked causing severe waterlogging {duration}. Water enters houses during every rain. Mosquito breeding has increased dramatically."),
        ("Storm drain overflow at {location}", "The storm drain at {location} overflows every time it rains. The water level rises to 2-3 feet on the road. Vehicles get stranded. This has been happening {duration}."),
        ("Drain cleaning not done at {location}", "The drainage canal at {location} has not been cleaned {duration}. It is full of garbage and silt. Water flow is completely blocked. Flooding is inevitable in next rain."),
        ("Clogged drain spreading mosquitoes at {location}", "A clogged drain at {location} has become a breeding ground for mosquitoes. Several dengue cases have been reported from this area {duration}. Urgent cleaning needed."),
    ],
    "ILLEGAL_DUMPING": [
        ("Illegal construction debris dumped at {location}", "Someone has dumped a large amount of construction debris at {location}. The dump has been growing {duration}. It is blocking the footpath and drainage. Fine the dumpers."),
        ("Encroachment on public land at {location}", "There is illegal encroachment on government land at {location}. Unauthorized structures are being built {duration}. The land is meant for a public park."),
        ("Illegal dumping of industrial waste at {location}", "Industrial waste is being dumped illegally near {location}. The chemicals are seeping into the ground and contaminating groundwater. This has been happening {duration}."),
        ("Unauthorized construction blocking road at {location}", "Unauthorized construction at {location} is blocking the public road. Building materials are scattered on the road {duration}. Pedestrians are forced to walk on the main road."),
    ],
    "OTHER": [
        ("Public toilet not maintained at {location}", "The public toilet facility at {location} is in terrible condition. It has not been cleaned {duration}. The stench is unbearable. People are forced to use open spaces."),
        ("Park not maintained at {location}", "The public park at {location} has not been maintained {duration}. Grass is overgrown, benches are broken, and the playground equipment is rusted and dangerous for children."),
        ("Noise pollution from loudspeakers at {location}", "Loudspeakers are being used at extremely high volume at {location} {duration}. It is causing disturbance to residents, students, and patients in the nearby hospital."),
        ("Government office not responding to complaints at {location}", "The municipal office at {location} is not responding to citizen complaints {duration}. Staff is absent and files are pending. We need accountability."),
    ],
}


def generate_training_data(samples_per_category: int = 50) -> List[Tuple[str, str, str]]:
    """
    Generate synthetic training data.
    
    Returns:
        List of (text, category, language) tuples.
        Text is title + " " + description.
    """
    data: List[Tuple[str, str, str]] = []

    for category, templates in TEMPLATES.items():
        for i in range(samples_per_category):
            template = random.choice(templates)
            location = random.choice(LOCATIONS)
            duration = random.choice(DURATIONS)

            title = template[0].format(location=location, duration=duration)
            desc = template[1].format(
                location=location, duration=duration, detail=""
            )
            text = f"{title}. {desc}"
            data.append((text, category, "en"))

    random.shuffle(data)
    return data


def export_to_csv(filepath: str, samples_per_category: int = 50):
    """Export training data to CSV file."""
    import csv

    data = generate_training_data(samples_per_category)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "category", "language"])
        for text, category, lang in data:
            writer.writerow([text, category, lang])

    print(f"Exported {len(data)} samples to {filepath}")
    return len(data)


if __name__ == "__main__":
    export_to_csv("training_data.csv", samples_per_category=50)
