using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Controllers
{
    public class CarregarImagem
    {
        //ver se passar um valor sem ter que ser dentro do parametro da função para manter o padrão
        public void LoadImage(string nomeAluno)
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("SELECT foto FROM alunos WHERE nome = @nome", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@nome", nomeAluno);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao carregar imagem: " + ex.Message);
            }
        }
    }
}
