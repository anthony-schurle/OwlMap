import map, node

class Main:
    def __init__(self):
        self.map = map.Map()

        rec = node.Node("Gibbs Recreation and Wellness Center", 29.718234287094702, -95.40365381464878)
        fondren = node.Node("Fondren Library", 29.7184889244895, -95.40003002999113)
        lovett = node.Node("Edgar Odell Lovett College", 29.716736984405465, -95.39799155165602)
        will_rice = node.Node("Will Rice College", 29.716466139816475, -95.39871387154595)
        hanszen = node.Node("Hanszen College", 29.715892410957814, -95.40018766506088)
        sid_richardson = node.Node("Sid Richardson College", 29.715691758825585, -95.39829300944861)
        weiss = node.Node("Wiess College", 29.714691511356488, -95.40085670596993)
        baker = node.Node("Baker College", 29.71733243453455, -95.39902187616832)
        duncan = node.Node("Duncan College", 29.72188855408422, -95.39846252369836)
        martel = node.Node("Martel College", 29.72179538030585, -95.39770614078927)
        jones = node.Node("Jones College", 29.72165096077053, -95.39676200326267)
        brown = node.Node("Brown College", 29.72158108027819, -95.39587687430644)
        mcMurtry = node.Node("McMurtry College", 29.720369810681373, -95.39811383654994)

        self.map.add_node(rec)
        self.map.add_node(fondren)
        self.map.add_node(lovett)
        self.map.add_node(will_rice)
        self.map.add_node(hanszen)
        self.map.add_node(sid_richardson)
        self.map.add_node(weiss)
        self.map.add_node(baker)
        self.map.add_node(mcMurtry)
        self.map.add_node(jones)
        self.map.add_node(martel)
        self.map.add_node(duncan)
        self.map.add_node(brown)

        self.map.add_edge(lovett, will_rice, 492)
        self.map.add_edge(fondren, will_rice, 1131)
        self.map.add_edge(fondren, rec, 1364)
        self.map.add_edge(hanszen, will_rice, 719)
        self.map.add_edge(fondren, hanszen, 1277)
        self.map.add_edge(sid_richardson, hanszen, 700)
        self.map.add_edge(sid_richardson, will_rice, 528)
        self.map.add_edge(weiss, hanszen, 551)
        self.map.add_edge(baker, will_rice, 226)
        self.map.add_edge(baker, fondren, 508)
        self.map.add_edge(mcMurtry, fondren, 972)
        self.map.add_edge(mcMurtry, rec, 1728)
        self.map.add_edge(jones, mcMurtry, 798)
        self.map.add_edge(martel, jones, 798)
        self.map.add_edge(duncan, martel, 328)
        self.map.add_edge(brown, jones, 320)
        self.map.add_edge(mcMurtry, lovett, 1728)
        self.map.add_edge(mcMurtry, baker, 1584)

    def get_nodes(self):
        return self.map.nodes.keys()
    
    def navigate(self, start_str, end_str):
        start = self.map.get_node(start_str)
        end = self.map.get_node(end_str)

        return self.map.navigation_distance(start, end)

