using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhEventItem : MonoBehaviour
	{
		[SerializeField]
		private string text;

		[SerializeField]
		private GameObject inputIntObject;

		[SerializeField]
		private GameObject inputStringObject;

		[SerializeField]
		private TextMeshProUGUI eventLabel;

		[SerializeField]
		private TMP_Dropdown trigger;

		[SerializeField]
		private TMP_InputField intInput;

		[SerializeField]
		private TMP_InputField stringInput;

		[SerializeField]
		private BhHierarchyGroup hierarchyGroup;

		private bqn buvk;

		private bsn buvl;

		private string buvm;

		private bool buvn;

		private bool buvo;

		private EEventTypes buvp;

		private Dictionary<string, EEventTypes> buvq;

		private BhEvents buvr;

		private const string buvs = "{0}({1})";

		public string cmpd => null;

		public void Init(string _eventData, BhEvents _events)
		{
		}

		public void DeleteEvent()
		{
		}

		public void UpdateData()
		{
		}

		private void nvr(EEventTypes a, bool b = false)
		{
		}
	}
}
