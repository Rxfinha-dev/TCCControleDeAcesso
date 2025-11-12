using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmLog : Form
    {
        Log _log;
        int id_escola;
        string _currentUsername;

        public frmLog(int idEscola, string currentUsername)
        {
            InitializeComponent();
            id_escola = idEscola;
            _currentUsername = currentUsername;
        }

        void carregarGrid()
        {
            _log = new Log();          
            dgvLog.DataSource = _log.ShowLog(id_escola);
            //dgvLog.Columns["id"].Visible = false;

        }

        private void dgvLog_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void frmLog_Load(object sender, EventArgs e)
        {
            carregarGrid();
        }

        private void backBtn_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu(_currentUsername, id_escola);
            check.Show();
            Close();
            
        }

        private void button1_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu(_currentUsername, id_escola);
            check.Show();
            Close();
            carregarGrid();
        }
    }
}
